import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '@core/services/redis.service';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private fallbackStorage = new Map<
    string,
    { hits: number; resetTime: number }
  >();

  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttler:${throttlerName}:${key}`;

    if (!this.redisService.isAvailable()) {
      return this.incrementInMemory(redisKey, ttl, limit, blockDuration);
    }

    try {
      const current = await this.redisService.get(redisKey);

      if (current === null) {
        await this.redisService.set(redisKey, '1', ttl);
        return {
          totalHits: 1,
          timeToExpire: ttl * 1000,
          isBlocked: false,
          timeToBlockExpire: 0,
        };
      } else {
        const totalHits = await this.redisService.incr(redisKey);

        const client = this.redisService.getClient();
        const timeToExpire = await client.ttl(redisKey);

        const isBlocked = totalHits > limit;
        const timeToBlockExpire = isBlocked ? blockDuration * 1000 : 0;

        return {
          totalHits,
          timeToExpire: timeToExpire > 0 ? timeToExpire * 1000 : 0,
          isBlocked,
          timeToBlockExpire,
        };
      }
    } catch {
      return this.incrementInMemory(redisKey, ttl, limit, blockDuration);
    }
  }

  private incrementInMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const resetTime = now + ttl * 1000;

    const existing = this.fallbackStorage.get(key);

    if (!existing || existing.resetTime <= now) {
      this.fallbackStorage.set(key, { hits: 1, resetTime });

      setTimeout(() => {
        this.fallbackStorage.delete(key);
      }, ttl * 1000);

      return {
        totalHits: 1,
        timeToExpire: ttl * 1000,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } else {
      existing.hits++;
      const isBlocked = existing.hits > limit;

      return {
        totalHits: existing.hits,
        timeToExpire: existing.resetTime - now,
        isBlocked,
        timeToBlockExpire: isBlocked ? blockDuration * 1000 : 0,
      };
    }
  }
}
