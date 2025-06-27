import {
  Scope,
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

import { BusinessException } from '@core/exeption-filters/business-exception.filter';
import { UserService } from '@components/user/user.service';
import { User } from '@database/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  [REQUEST_USER_KEY]?: User;
  body: Record<string, unknown> & { user?: User; userId?: string };
  params: Record<string, string> & { userId?: string };
  query: Record<string, string | string[] | undefined> & { userId?: string };
}

export interface IJwtPayload {
  id: string;
  role?: number;
  email?: string;
  isAdmin?: boolean;
}

@Injectable({ scope: Scope.REQUEST })
export class AuthenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,

    private readonly i18n: I18nService,

    private readonly jwtService: JwtService,

    private configService: ConfigService<AllConfigType>,

    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const authConfig = this.configService.get('auth', {
      infer: true,
    })!;

    let payload: IJwtPayload | null = null;

    try {
      payload = this.jwtService.verify<IJwtPayload>(token, {
        secret: authConfig.accessSecret,
      });
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      switch (e.name) {
        case 'TokenExpiredError':
          throw new BusinessException(
            this.i18n.translate('error.TOKEN_EXPIRED'),
            ResponseCodeEnum.BAD_REQUEST,
          );
        case 'JsonWebTokenError':
          throw new BusinessException(
            this.i18n.translate('error.TOKEN_INVALID'),
            ResponseCodeEnum.BAD_REQUEST,
          );
        default:
          throw new BusinessException(
            this.i18n.translate('error.TOKEN_INVALID'),
            ResponseCodeEnum.BAD_REQUEST,
          );
      }
    }

    const { id } = payload;
    const user = await this.userService.findById(id);

    if (!user) {
      throw new UnauthorizedException();
    }

    request['userId'] = user.id;
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
