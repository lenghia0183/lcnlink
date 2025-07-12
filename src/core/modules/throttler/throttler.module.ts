import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '@core/services/redis.service';
import { RedisThrottlerStorage } from '@core/storage/redis-throttler.storage';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      useFactory: (redisService: RedisService) => {
        const storage = new RedisThrottlerStorage(redisService);
        return {
          throttlers: [],
          storage,
        };
      },
      inject: [RedisService],
    }),
  ],
  exports: [ThrottlerModule],
})
export class CustomThrottlerModule {}
