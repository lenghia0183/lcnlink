import {
  ThrottlerGuard,
  ThrottlerStorage,
  ThrottlerException,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Injectable, ExecutionContext } from '@nestjs/common';

import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { LoggedInRequest } from '@core/types/logged-in-request.type';

import { DEFAULT_THROTTLE_CONFIG } from '@constant/throttle.constant';
import {
  ThrottleByRoleOptions,
  ThrottleLimitByRole,
  ThrottleTtlByRole,
} from '@core/types/throttle.type';
import { THROTTLE_BY_ROLE_KEY } from '@constant/app.enum';
import { I18nErrorKeys } from '@constant/i18n-keys.enum';

@Injectable()
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
    const role = req?.userRole || USER_ROLE_ENUM.GUEST;
    const identifier = req?.userId || req?.ip || 'anonymous';
    return Promise.resolve(`${role}-${identifier}`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roleBasedOptions =
      this.reflector.getAllAndOverride<ThrottleByRoleOptions>(
        THROTTLE_BY_ROLE_KEY,
        [context.getHandler(), context.getClass()],
      );

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
    const userRole = request.userRole ?? USER_ROLE_ENUM.GUEST;

    const { limit, ttl } = this.getRoleLimitsFromOptions(userRole, options);

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
    const userRole = request.userRole ?? USER_ROLE_ENUM.GUEST;

    const { limit, ttl } = this.getDefaultRoleLimits(userRole);

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
    userRole: USER_ROLE_ENUM,
    options: ThrottleByRoleOptions,
  ): {
    limit: number;
    ttl: number;
  } {
    const { ttl, limits } = options;

    return {
      limit: this.getLimitForRole(userRole, limits),
      ttl: this.getTtlForRole(userRole, ttl),
    };
  }

  private getDefaultRoleLimits(userRole: USER_ROLE_ENUM): {
    limit: number;
    ttl: number;
  } {
    switch (userRole) {
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
          ttl: DEFAULT_THROTTLE_CONFIG.TTL[USER_ROLE_ENUM.GUEST],
        };
      default:
        return {
          limit: DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.GUEST],
          ttl: DEFAULT_THROTTLE_CONFIG.TTL[USER_ROLE_ENUM.GUEST],
        };
    }
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

    return ttl[role] ?? DEFAULT_THROTTLE_CONFIG.TTL[role] ?? 60;
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

    return limits[role] ?? DEFAULT_THROTTLE_CONFIG.LIMITS[role] ?? 60;
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
    throw new ThrottlerException(this.i18n.t(I18nErrorKeys.TOO_MANY_REQUEST));
  }
}
