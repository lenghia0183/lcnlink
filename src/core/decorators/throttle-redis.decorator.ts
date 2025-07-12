import { applyDecorators, SetMetadata } from '@nestjs/common';
import { THROTTLE_PRESETS } from '@core/constants/throttle.constant';
import { ThrottleByRoleOptions } from '@core/types/throttle.type';

export const THROTTLE_BY_ROLE_KEY = 'THROTTLE_BY_ROLE';

export function ThrottleByRole(options: ThrottleByRoleOptions) {
  return applyDecorators(SetMetadata(THROTTLE_BY_ROLE_KEY, options));
}

export const ThrottleForAuth = () =>
  ThrottleByRole({
    ttl: THROTTLE_PRESETS.AUTH.TTL,
    limits: THROTTLE_PRESETS.AUTH.LIMITS,
  });

export const ThrottleForUpload = () =>
  ThrottleByRole({
    ttl: THROTTLE_PRESETS.UPLOAD.TTL,
    limits: THROTTLE_PRESETS.UPLOAD.LIMITS,
  });

export const ThrottleForSearch = () =>
  ThrottleByRole({
    ttl: THROTTLE_PRESETS.SEARCH.TTL,
    limits: THROTTLE_PRESETS.SEARCH.LIMITS,
  });

export const ThrottlePublicUnlimited = () =>
  ThrottleByRole({
    ttl: 'unlimited',
    limits: 'unlimited',
  });
