import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '@core/guards/custom-throttler.guard';

interface ThrottleRedisOptions {
  ttl: number; // Time to live in seconds
  limit: number; // Number of requests allowed
}

interface ThrottleNamedOptions {
  name?: 'default' | 'admin' | 'public';
  ttl: number;
  limit: number;
}

/**
 * Apply Redis-based throttling to a route or controller
 * @param options Throttling configuration
 */
export function ThrottleRedis(options: ThrottleRedisOptions) {
  return applyDecorators(
    Throttle({ default: options }),
    UseGuards(CustomThrottlerGuard),
  );
}

/**
 * Apply named throttling configuration
 * @param options Named throttling configuration
 */
export function ThrottleNamed(options: ThrottleNamedOptions) {
  const throttlerName = options.name || 'default';
  return applyDecorators(
    Throttle({ [throttlerName]: { ttl: options.ttl, limit: options.limit } }),
    UseGuards(CustomThrottlerGuard),
  );
}

/**
 * Predefined throttling for different user types
 * These will use the configured throttlers from CustomThrottlerModule
 */
export const ThrottleForUser = () =>
  ThrottleNamed({
    name: 'default',
    ttl: 60,
    limit: 5,
  });

export const ThrottleForAdmin = () =>
  ThrottleNamed({
    name: 'admin',
    ttl: 60,
    limit: 15,
  });

export const ThrottleForPublic = () =>
  ThrottleNamed({
    name: 'public',
    ttl: 60,
    limit: 2,
  });

/**
 * Specialized throttling decorators for specific use cases
 */
export const ThrottleForAuth = () => ThrottleRedis({ ttl: 300, limit: 5 }); // 5 attempts per 5 minutes
export const ThrottleForUpload = () => ThrottleRedis({ ttl: 60, limit: 3 }); // 3 uploads per minute
export const ThrottleForSearch = () => ThrottleRedis({ ttl: 10, limit: 10 }); // 10 searches per 10 seconds
export const ThrottleForAPI = () => ThrottleRedis({ ttl: 60, limit: 100 }); // 100 API calls per minute

/**
 * Burst protection - very short TTL with low limit
 */
export const ThrottleBurst = () => ThrottleRedis({ ttl: 1, limit: 2 }); // 2 requests per second

/**
 * Heavy operations - long TTL with very low limit
 */
export const ThrottleHeavy = () => ThrottleRedis({ ttl: 3600, limit: 1 }); // 1 request per hour
