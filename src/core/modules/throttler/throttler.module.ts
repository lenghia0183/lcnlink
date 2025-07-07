import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from '@core/services/redis.service';
import { RedisThrottlerStorage } from '@core/storage/redis-throttler.storage';
import { AllConfigType } from '@config/config.type';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      useFactory: (
        configService: ConfigService<AllConfigType>,
        redisService: RedisService,
      ) => {
        const appConfig = configService.get('app', { infer: true });
        const isProduction = appConfig?.nodeEnv === 'production';

        // Always use RedisThrottlerStorage with built-in fallback
        const storage = new RedisThrottlerStorage(redisService);

        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60000, // 60 seconds in milliseconds
              limit: isProduction ? 5 : 10, // Stricter limits in production
            },
            {
              name: 'admin',
              ttl: 60000, // 60 seconds in milliseconds
              limit: isProduction ? 15 : 20, // Higher limit for admin
            },
            {
              name: 'public',
              ttl: 60000, // 60 seconds in milliseconds
              limit: isProduction ? 2 : 5, // Very strict for public endpoints
            },
          ],
          storage, // Will be undefined for in-memory storage
        };
      },
      inject: [ConfigService, RedisService],
    }),
  ],
  exports: [ThrottlerModule],
})
export class CustomThrottlerModule {}
