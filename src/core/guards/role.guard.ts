import { isEmpty } from 'lodash';
import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { REQUEST_USER_KEY, ROLES_KEY } from '@constant/app.enum';
import { User } from '@database/entities/user.entity';
import { AuthenticatedRequest } from './authenticate.guard';
import { I18nService } from 'nestjs-i18n';

import { ResponseCodeEnum } from '@constant/response-code.enum';
import { BusinessException } from '@core/exception-filters/business-exception.filter';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE_ENUM[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isEmpty(requiredRoles)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request[REQUEST_USER_KEY] as User;

    if (!user) {
      throw new BusinessException(
        this.i18n.translate('error.FORBIDDEN'),
        ResponseCodeEnum.FORBIDDEN,
      );
    }
    if (requiredRoles.includes(user.role)) {
      return true;
    } else {
      throw new BusinessException(
        this.i18n.translate('error.FORBIDDEN'),
        ResponseCodeEnum.FORBIDDEN,
      );
    }
  }
}
