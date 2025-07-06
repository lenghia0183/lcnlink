import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from 'src/services/redis.service';
import { RedisThrottlerStorage } from '@core/storage/redis-throttler.storage';
import { AllConfigType } from '@config/config.type';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      useFactory: async (
        configService: ConfigService<AllConfigType>,
        redisService: RedisService,
      ) => {
        const appConfig = configService.get('app', { infer: true });
        const isProduction = appConfig?.nodeEnv === 'production';

        // Check if Redis is available
        let storage: RedisThrottlerStorage | undefined;
        if (redisService.isAvailable()) {
          try {
            const client = redisService.getClient();
            await client.ping(); // Validate connection
            storage = new RedisThrottlerStorage(redisService);
            console.log('✅ Using Redis storage for throttling');
          } catch {
            console.warn(
              '⚠️ Redis validation failed, using in-memory storage for throttling',
            );
            storage = undefined; // Use default in-memory storage
          }
        } else {
          console.warn(
            '⚠️ Redis not available, using in-memory storage for throttling',
          );
          storage = undefined; // Use default in-memory storage
        }

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
