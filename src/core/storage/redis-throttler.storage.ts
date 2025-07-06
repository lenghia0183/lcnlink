import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from 'src/services/redis.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttler:${throttlerName}:${key}`;

    // Get current value
    const current = await this.redisService.get(redisKey);
    console.log('current', current);

    if (current === null) {
      // First request - set initial value
      await this.redisService.set(redisKey, '1', ttl);
      return {
        totalHits: 1,
        timeToExpire: ttl * 1000, // Convert to milliseconds
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } else {
      // Increment existing value
      const totalHits = await this.redisService.incr(redisKey);

      // Get TTL for the key
      const client = this.redisService.getClient();
      const timeToExpire = await client.ttl(redisKey);

      // Check if blocked
      const isBlocked = totalHits > limit;
      const timeToBlockExpire = isBlocked ? blockDuration * 1000 : 0;

      return {
        totalHits,
        timeToExpire: timeToExpire > 0 ? timeToExpire * 1000 : 0, // Convert to milliseconds
        isBlocked,
        timeToBlockExpire,
      };
    }
  }
}
