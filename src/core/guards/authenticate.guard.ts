import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@config/config.type';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { IS_PUBLIC_KEY, REQUEST_USER_KEY } from '@constant/app.enum';

import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { LoggedInRequest } from '@core/types/logged-in-request.type';
import { JwtPayload } from '@core/types/jwt-payload.type';
import { UserRepository } from '@database/repositories';
import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { I18nErrorKeys } from '@constant/i18n-keys.enum';

@Injectable()
export class AuthenticateGuard implements CanActivate {
  constructor(
    private reflector: Reflector,

    private readonly i18n: I18nService,

    private readonly jwtService: JwtService,

    private configService: ConfigService<AllConfigType>,

    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<LoggedInRequest>();
    const token = this.extractTokenFromHeader(request);

    if (isPublic) {
      if (!token) {
        request['userRole'] = USER_ROLE_ENUM.GUEST;
        return true;
      }
    } else {
      if (!token) {
        throw new BusinessException(
          this.i18n.translate(I18nErrorKeys.UNAUTHORIZED),
          ResponseCodeEnum.UNAUTHORIZED,
        );
      }
    }

    const authConfig = this.configService.get('auth', {
      infer: true,
    })!;

    let payload: JwtPayload | null = null;

    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: authConfig.accessSecret,
      });
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      switch (e.name) {
        case 'TokenExpiredError':
          throw new BusinessException(
            this.i18n.translate(I18nErrorKeys.TOKEN_EXPIRED),
            ResponseCodeEnum.UNAUTHORIZED,
          );
        case 'JsonWebTokenError':
          throw new BusinessException(
            this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
            ResponseCodeEnum.UNAUTHORIZED,
          );
        default:
          throw new BusinessException(
            this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
            ResponseCodeEnum.UNAUTHORIZED,
          );
      }
    }

    const { id } = payload;
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UnauthorizedException();
    }

    request['userId'] = user.id;
    request['userRole'] = user.role;
    request[REQUEST_USER_KEY] = user;

    if (request.body) {
      request.body.user = user;
      request.body.userId = user.id;
    }

    if (request.params) {
      request.params.userId = user.id;
    }

    if (request.query) {
      request.query.userId = user.id;
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
