import { USER_ROLE_ENUM } from '@components/user/user.constant';

export const DEFAULT_THROTTLE_CONFIG = {
  TTL: {
    [USER_ROLE_ENUM.ADMIN]: 30,
    [USER_ROLE_ENUM.USER]: 30,
    [USER_ROLE_ENUM.GUEST]: 30,
    UNKNOWN_ROLE: 30,
  },
  LIMITS: {
    [USER_ROLE_ENUM.ADMIN]: 50,
    [USER_ROLE_ENUM.USER]: 35,
    [USER_ROLE_ENUM.GUEST]: 20,
    UNKNOWN_ROLE: 5,
  },
} as const;

export const THROTTLE_PRESETS = {
  AUTH: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30,
      [USER_ROLE_ENUM.USER]: 30,
      [USER_ROLE_ENUM.GUEST]: 30,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 20,
      [USER_ROLE_ENUM.USER]: 15,
      [USER_ROLE_ENUM.GUEST]: 10,
    },
  },

  UPLOAD: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30,
      [USER_ROLE_ENUM.USER]: 30,
      [USER_ROLE_ENUM.GUEST]: 30,
      guest: 120,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 10,
      [USER_ROLE_ENUM.USER]: 5,
      [USER_ROLE_ENUM.GUEST]: 3,
    },
  },

  SEARCH: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30,
      [USER_ROLE_ENUM.USER]: 30,
      [USER_ROLE_ENUM.GUEST]: 30,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 50,
      [USER_ROLE_ENUM.USER]: 20,
      [USER_ROLE_ENUM.GUEST]: 15,
    },
  },

  API: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30,
      [USER_ROLE_ENUM.USER]: 30,
      [USER_ROLE_ENUM.GUEST]: 30,
      guest: 120,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 200,
      [USER_ROLE_ENUM.USER]: 100,
      [USER_ROLE_ENUM.GUEST]: 70,
    },
  },
} as const;

export function getDefaultLimitForRole(
  role: USER_ROLE_ENUM | undefined,
): number {
  if (role === USER_ROLE_ENUM.ADMIN) {
    return DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.ADMIN];
  }

  if (role === USER_ROLE_ENUM.USER) {
    return DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.USER];
  }

  if (role === USER_ROLE_ENUM.GUEST) {
    return DEFAULT_THROTTLE_CONFIG.LIMITS[USER_ROLE_ENUM.GUEST];
  }

  return DEFAULT_THROTTLE_CONFIG.LIMITS.UNKNOWN_ROLE;
}

export function getThrottlePreset(presetName: keyof typeof THROTTLE_PRESETS) {
  return THROTTLE_PRESETS[presetName];
}
