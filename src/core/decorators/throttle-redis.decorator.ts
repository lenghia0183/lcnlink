import { applyDecorators, SetMetadata } from '@nestjs/common';
import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { THROTTLE_PRESETS } from '@core/constants/throttle.constant';
import { ThrottleByRoleOptions } from '@core/types/throttle.type';

export const THROTTLE_BY_ROLE_KEY = 'THROTTLE_BY_ROLE';

export function ThrottleByRole(options: ThrottleByRoleOptions) {
  return applyDecorators(SetMetadata(THROTTLE_BY_ROLE_KEY, options));
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
