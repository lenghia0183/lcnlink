import { isEmpty } from 'lodash';
import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { REQUEST_USER_KEY, ROLES_KEY } from '@constant/app.enum';
import { User } from '@database/entities/user.entity';
import { AuthenticatedRequest } from './authen.guards';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
