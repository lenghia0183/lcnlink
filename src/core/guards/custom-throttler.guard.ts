import {
  ThrottlerGuard,
  ThrottlerStorage,
  ThrottlerException,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Injectable, ExecutionContext } from '@nestjs/common';

import { REQUEST_USER_KEY } from '@constant/app.enum';
import { User } from '@database/entities/user.entity';
import { USER_ROLE_ENUM } from '@components/user/user.constant';

// Throttler metadata key (from @nestjs/throttler source)
const THROTTLER_LIMIT = 'THROTTLER:LIMIT';

interface ThrottlerLimits {
  [key: string]: {
    limit: number;
    ttl: number;
  };
}

interface RequestWithUser extends Request {
  [REQUEST_USER_KEY]?: User;
  user?: User;
  ip: string;
}

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

  // Override the default tracking logic
  protected getTracker(req: RequestWithUser): Promise<string> {
    // Use the user's ID for tracking if authenticated, else use the IP
    return Promise.resolve(req.user?.id || req.ip);
  }

  // Override the main canActivate method to handle both decorators and default behavior
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if there are any throttle decorators on the route
    const throttleLimits = this.reflector.getAllAndOverride<ThrottlerLimits>(
      THROTTLER_LIMIT,
      [context.getHandler(), context.getClass()],
    );

    // If decorators are present, use the parent implementation
    if (this.hasThrottleDecorators(throttleLimits)) {
      return super.canActivate(context);
    }

    // Otherwise, apply our custom role-based throttling
    return this.applyRoleBasedThrottling(context);
  }

  // Check if throttle decorators are present
  private hasThrottleDecorators(
    throttleLimits: ThrottlerLimits | undefined,
  ): boolean {
    return (
      throttleLimits !== undefined && Object.keys(throttleLimits).length > 0
    );
  }

  // Apply role-based throttling when no decorators are present
  private async applyRoleBasedThrottling(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request[REQUEST_USER_KEY];

    // Determine limits based on user role
    const { limit, ttl } = this.getRoleLimits(user);

    // Get tracker (user ID or IP)
    const tracker = await this.getTracker(request);

    // Generate unique key for this endpoint and tracker
    const key = this.createThrottleKey(context, tracker);

    // Check and increment the counter
    const result = await this.storageService.increment(
      key,
      ttl,
      limit,
      0, // blockDuration
      'default', // throttlerName
    );

    // Check if limit exceeded
    if (result.totalHits > limit) {
      await this.throwThrottlingException();
    }

    return true;
  }

  // Get rate limits based on user role
  private getRoleLimits(user: User | undefined): {
    limit: number;
    ttl: number;
  } {
    const ttl = 60; // 60 seconds default

    if (user?.role === USER_ROLE_ENUM.ADMIN) {
      return { limit: 15, ttl }; // Admin gets 15 requests per 60 seconds
    }

    return { limit: 5, ttl }; // Regular users get 5 requests per 60 seconds
  }

  // Generate a unique key for the throttling
  private createThrottleKey(
    context: ExecutionContext,
    tracker: string,
  ): string {
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    return `${className}-${methodName}-${tracker}`;
  }

  // Override the throwThrottlingException method to use i18n
  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(this.i18n.t('error.TOO_MANY_REQUEST'));
  }
}
