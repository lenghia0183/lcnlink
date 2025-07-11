import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '@core/guards/custom-throttler.guard';
import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { THROTTLE_PRESETS } from '@core/constants/throttle.constant';
import { ThrottleByRoleOptions } from '@core/types/throttle.type';

interface ThrottleRedisOptions {
  ttl: number;
  limit: number;
}

export const THROTTLE_BY_ROLE_KEY = 'THROTTLE_BY_ROLE';

export function ThrottleRedis(options: ThrottleRedisOptions) {
  return applyDecorators(
    Throttle({ default: options }),
    UseGuards(CustomThrottlerGuard),
  );
}

export function ThrottleByRole(options: ThrottleByRoleOptions) {
  return applyDecorators(
    SetMetadata(THROTTLE_BY_ROLE_KEY, options),
    UseGuards(CustomThrottlerGuard),
  );
}

export const ThrottleForAuth = () =>
  ThrottleByRole({
    ttl: THROTTLE_PRESETS.AUTH.TTL,
    limits: {
      [USER_ROLE_ENUM.USER]: THROTTLE_PRESETS.AUTH.LIMITS[USER_ROLE_ENUM.USER],
      [USER_ROLE_ENUM.ADMIN]:
        THROTTLE_PRESETS.AUTH.LIMITS[USER_ROLE_ENUM.ADMIN],
      [USER_ROLE_ENUM.GUEST]:
        THROTTLE_PRESETS.AUTH.LIMITS[USER_ROLE_ENUM.GUEST],
    },
  });

export const ThrottleForUpload = () =>
  ThrottleByRole({
    ttl: THROTTLE_PRESETS.UPLOAD.TTL,
    limits: {
      [USER_ROLE_ENUM.USER]:
        THROTTLE_PRESETS.UPLOAD.LIMITS[USER_ROLE_ENUM.USER],
      [USER_ROLE_ENUM.ADMIN]:
        THROTTLE_PRESETS.UPLOAD.LIMITS[USER_ROLE_ENUM.ADMIN],
      [USER_ROLE_ENUM.GUEST]:
        THROTTLE_PRESETS.UPLOAD.LIMITS[USER_ROLE_ENUM.GUEST],
    },
  });

export const ThrottleForSearch = () =>
  ThrottleByRole({
    ttl: THROTTLE_PRESETS.SEARCH.TTL,
    limits: {
      [USER_ROLE_ENUM.USER]:
        THROTTLE_PRESETS.SEARCH.LIMITS[USER_ROLE_ENUM.USER],
      [USER_ROLE_ENUM.ADMIN]:
        THROTTLE_PRESETS.SEARCH.LIMITS[USER_ROLE_ENUM.ADMIN],
      [USER_ROLE_ENUM.GUEST]:
        THROTTLE_PRESETS.SEARCH.LIMITS[USER_ROLE_ENUM.GUEST],
    },
  });

export const ThrottlePublicUnlimited = () =>
  ThrottleByRole({
    ttl: 'unlimited',
    limits: 'unlimited',
  });
