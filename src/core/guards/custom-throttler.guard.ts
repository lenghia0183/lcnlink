import {
  ThrottlerGuard,
  ThrottlerStorage,
  ThrottlerException,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Injectable, ExecutionContext, Scope } from '@nestjs/common';

import { REQUEST_USER_KEY } from '@constant/app.enum';
import { User } from '@database/entities/user.entity';
import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { LoggedInRequest } from '@core/types/logged-in-request.type';
import { THROTTLE_BY_ROLE_KEY } from '@core/decorators/throttle-redis.decorator';
import { DEFAULT_THROTTLE_CONFIG } from '@core/constants/throttle.constant';
import {
  ThrottleByRoleOptions,
  ThrottleLimitByRole,
  ThrottleTtlByRole,
} from '@core/types/throttle.type';

@Injectable({ scope: Scope.REQUEST })
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly i18n: I18nService,
  ) {
    super(options, storageService, reflector);
  }

  protected getTracker(req: LoggedInRequest): Promise<string> {
    return Promise.resolve(req?.userId || req?.ip || '');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roleBasedOptions =
      this.reflector.getAllAndOverride<ThrottleByRoleOptions>(
        THROTTLE_BY_ROLE_KEY,
        [context.getHandler(), context.getClass()],
      );
    console.log('roleBasedOptions', roleBasedOptions);
    if (roleBasedOptions) {
      return this.applyDefaultRoleBasedThrottlingWithOptions(
        context,
        roleBasedOptions,
      );
    }

    return this.applyDefaultRoleBasedThrottling(context);
  }

  private async applyDefaultRoleBasedThrottlingWithOptions(
    context: ExecutionContext,
    options: ThrottleByRoleOptions,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoggedInRequest>();
    const user = request[REQUEST_USER_KEY];

    const { limit, ttl } = this.getRoleLimitsFromOptions(user, options);

    console.log('🚀 ~ CustomThrottlerGuard ~ ttl:', ttl);
    console.log('🚀 ~ CustomThrottlerGuard ~ limit:', limit);

    if (limit === -1) {
      return true;
    }

    const tracker = await this.getTracker(request);

    const key = this.createThrottleKey(context, tracker);

    const result = await this.storageService.increment(
      key,
      ttl,
      limit,
      0,
      'role-based',
    );

    if (result.totalHits > limit) {
      await this.throwThrottlingException();
    }

    return true;
  }

  private async applyDefaultRoleBasedThrottling(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoggedInRequest>();
    const user = request[REQUEST_USER_KEY];

    const { limit, ttl } = this.getDefaultRoleLimits(user);

    const tracker = await this.getTracker(request);

    const key = this.createThrottleKey(context, tracker);

    const result = await this.storageService.increment(
      key,
      ttl,
      limit,
      0,
      'default',
    );

    if (result.totalHits > limit) {
      await this.throwThrottlingException();
    }

    return true;
  }

  private getRoleLimitsFromOptions(
    user: User | undefined,
    options: ThrottleByRoleOptions,
  ): {
    limit: number;
    ttl: number;
  } {
    const { ttl, limits } = options;

    if (user) {
      return {
        limit: this.getLimitForRole(user.role, limits),
        ttl: this.getTtlForRole(user.role, ttl),
      };
    } else {
      const guestLimit =
        typeof limits === 'object' ? limits[USER_ROLE_ENUM.GUEST] : undefined;

      const guestTtl =
        typeof ttl === 'object' ? ttl[USER_ROLE_ENUM.GUEST] : undefined;

      return {
        limit:
          guestLimit ?? DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.GUEST],
        ttl: guestTtl ?? DEFAULT_THROTTLE_CONFIG.TTL[USER_ROLE_ENUM.GUEST],
      };
    }
  }

  private getDefaultRoleLimits(user: User | undefined): {
    limit: number;
    ttl: number;
  } {
    if (user) {
      switch (user.role) {
        case USER_ROLE_ENUM.ADMIN:
          return {
            limit: DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.ADMIN],
            ttl: DEFAULT_THROTTLE_CONFIG.TTL[USER_ROLE_ENUM.ADMIN],
          };
        case USER_ROLE_ENUM.USER:
          return {
            limit: DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.USER],
            ttl: DEFAULT_THROTTLE_CONFIG.TTL[USER_ROLE_ENUM.USER],
          };
        case USER_ROLE_ENUM.GUEST:
          return {
            limit: DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.GUEST],
            ttl: DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.GUEST],
          };
        default:
          return {
            limit: DEFAULT_THROTTLE_CONFIG.LIMITS.UNKNOWN_ROLE,
            ttl: DEFAULT_THROTTLE_CONFIG.TTL.UNKNOWN_ROLE,
          };
      }
    }

    return {
      limit: DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.GUEST],
      ttl: DEFAULT_THROTTLE_CONFIG.TTL[USER_ROLE_ENUM.GUEST],
    };
  }

  private getTtlForRole = (
    role: USER_ROLE_ENUM,
    ttl: ThrottleTtlByRole,
  ): number => {
    if (typeof ttl === 'number') {
      return ttl;
    }
    if (typeof ttl === 'string') {
      return -1;
    }

    return ttl[role] || DEFAULT_THROTTLE_CONFIG.TTL[role] || 60;
  };

  private getLimitForRole = (
    role: USER_ROLE_ENUM,
    limits: ThrottleLimitByRole,
  ): number => {
    if (typeof limits === 'number') {
      return limits;
    }

    if (typeof limits === 'string') {
      return -1;
    }

    return limits[role] || DEFAULT_THROTTLE_CONFIG.LIMITS[role] || 60;
  };

  private createThrottleKey(
    context: ExecutionContext,
    tracker: string,
  ): string {
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    return `${className}-${methodName}-${tracker}`;
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(this.i18n.t('error.TOO_MANY_REQUEST'));
  }
}
