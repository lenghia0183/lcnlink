import { USER_ROLE_ENUM } from '@components/user/user.constant';

export const DEFAULT_THROTTLE_CONFIG = {
  TTL: {
    [USER_ROLE_ENUM.ADMIN]: 30,
    [USER_ROLE_ENUM.USER]: 10,
    [USER_ROLE_ENUM.GUEST]: 10,
    UNKNOWN_ROLE: 5,
  },
  LIMITS: {
    [USER_ROLE_ENUM.ADMIN]: 3,
    [USER_ROLE_ENUM.USER]: 2,
    [USER_ROLE_ENUM.GUEST]: 1,
    UNKNOWN_ROLE: 5,
  },
} as const;

export const THROTTLE_PRESETS = {
  // Authentication endpoints
  AUTH: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 300, // Admin: 5 minutes
      [USER_ROLE_ENUM.USER]: 300, // User: 5 minutes
      [USER_ROLE_ENUM.GUEST]: 600, // Guest: 10 minutes (stricter)
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 10,
      [USER_ROLE_ENUM.USER]: 5,
      [USER_ROLE_ENUM.GUEST]: 3,
    },
  },

  // File upload endpoints
  UPLOAD: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30, // Admin: 30 seconds
      [USER_ROLE_ENUM.USER]: 60, // User: 1 minute
      [USER_ROLE_ENUM.GUEST]: 120, // Guest: 2 minutes (stricter)
      guest: 120,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 30,
      [USER_ROLE_ENUM.USER]: 10,
      [USER_ROLE_ENUM.GUEST]: 1,
    },
  },

  // Search endpoints
  SEARCH: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 5, // Admin: 5 seconds
      [USER_ROLE_ENUM.USER]: 10, // User: 10 seconds
      [USER_ROLE_ENUM.GUEST]: 30, // Guest: 30 seconds (stricter)
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 20,
      [USER_ROLE_ENUM.USER]: 10,
      [USER_ROLE_ENUM.GUEST]: 5,
    },
  },

  // API endpoints
  API: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30, // Admin: 30 seconds
      [USER_ROLE_ENUM.USER]: 60, // User: 1 minute
      [USER_ROLE_ENUM.GUEST]: 120, // Guest: 2 minutes (stricter)
      guest: 120,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 200,
      [USER_ROLE_ENUM.USER]: 100,
      [USER_ROLE_ENUM.GUEST]: 20,
    },
  },

  // Burst protection
  BURST: {
    TTL: 1, // Same for all roles - 1 second
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 5,
      [USER_ROLE_ENUM.USER]: 2,
      [USER_ROLE_ENUM.GUEST]: 1,
    },
  },

  // Heavy operations
  HEAVY: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 1800, // Admin: 30 minutes
      [USER_ROLE_ENUM.USER]: 3600, // User: 1 hour
      [USER_ROLE_ENUM.GUEST]: 7200, // Guest: 2 hours (stricter)
      guest: 7200,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 3,
      [USER_ROLE_ENUM.USER]: 1,
      [USER_ROLE_ENUM.GUEST]: 1,
    },
  },

  // Standard throttling
  STANDARD: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 30, // Admin: 30 seconds
      [USER_ROLE_ENUM.USER]: 60, // User: 1 minute
      [USER_ROLE_ENUM.GUEST]: 120, // Guest: 2 minutes
      guest: 120,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 30,
      [USER_ROLE_ENUM.USER]: 10,
      [USER_ROLE_ENUM.GUEST]: 5,
    },
  },

  // Strict throttling
  STRICT: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 60, // Admin: 1 minute
      [USER_ROLE_ENUM.USER]: 120, // User: 2 minutes
      [USER_ROLE_ENUM.GUEST]: 300, // Guest: 5 minutes (stricter)
      guest: 300,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 15,
      [USER_ROLE_ENUM.USER]: 5,
      [USER_ROLE_ENUM.GUEST]: 2,
    },
  },

  // Relaxed throttling
  RELAXED: {
    TTL: {
      [USER_ROLE_ENUM.ADMIN]: 15, // Admin: 15 seconds
      [USER_ROLE_ENUM.USER]: 30, // User: 30 seconds
      [USER_ROLE_ENUM.GUEST]: 60, // Guest: 1 minute
      guest: 60,
    },
    LIMITS: {
      [USER_ROLE_ENUM.ADMIN]: 100,
      [USER_ROLE_ENUM.USER]: 50,
      [USER_ROLE_ENUM.GUEST]: 20,
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

  // For unknown roles
  return DEFAULT_THROTTLE_CONFIG.LIMITS.UNKNOWN_ROLE;
}

/**
 * Helper function to get preset configuration
 */
export function getThrottlePreset(presetName: keyof typeof THROTTLE_PRESETS) {
  return THROTTLE_PRESETS[presetName];
}
