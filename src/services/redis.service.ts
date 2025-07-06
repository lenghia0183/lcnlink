import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@config/config.type';

interface RedisClient {
  on(event: string, callback: (error?: Error) => void): void;
  ping(): Promise<string>;
  quit(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<number>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient | null = null;
  private readonly logger = new Logger(RedisService.name);
  private isRedisAvailable = false;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  async onModuleInit(): Promise<void> {
    const redisConfig = this.configService.get('redis', { infer: true });

    try {
      // Dynamic import to avoid TypeScript issues
      const { default: IORedis } = await import('ioredis');

      this.client = new IORedis({
        host: redisConfig?.host || 'localhost',
        port: redisConfig?.port || 6379,
        password: redisConfig?.password,
        db: redisConfig?.db || 0,
        connectTimeout: 5000, // 5 second timeout
        lazyConnect: true,
      }) as RedisClient;

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
        this.isRedisAvailable = true;
      });

      this.client.on('error', (error?: Error) => {
        this.logger.warn('Redis connection error:', error?.message);
        this.isRedisAvailable = false;
      });

      // Test connection
      try {
        await this.client.ping();
        this.logger.log('Redis connection established');
        this.isRedisAvailable = true;
      } catch (error) {
        this.logger.warn(
          'Redis not available, throttling will use in-memory fallback:',
          (error as Error)?.message,
        );
        this.isRedisAvailable = false;
        this.client = null;
      }
    } catch (error) {
      this.logger.warn(
        'Failed to initialize Redis, throttling will use in-memory fallback:',
        (error as Error)?.message,
      );
      this.isRedisAvailable = false;
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis connection closed');
      } catch (error) {
        this.logger.error('Error closing Redis connection:', error);
      } finally {
        this.client = null;
      }
    }
  }

  getClient(): RedisClient {
    if (!this.client || !this.isRedisAvailable) {
      throw new Error('Redis client not available');
    }
    return this.client;
  }

  isAvailable(): boolean {
    return this.isRedisAvailable && this.client !== null;
  }

  private ensureClient(): RedisClient {
    if (!this.client || !this.isRedisAvailable) {
      throw new Error('Redis client not available');
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis not available for GET operation');
      return null;
    }
    try {
      const client = this.ensureClient();
      return await client.get(key);
    } catch (error) {
      this.logger.warn(
        'Redis GET operation failed:',
        (error as Error)?.message,
      );
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis not available for SET operation');
      return;
    }
    try {
      const client = this.ensureClient();
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      this.logger.warn(
        'Redis SET operation failed:',
        (error as Error)?.message,
      );
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis not available for DEL operation');
      return;
    }
    try {
      const client = this.ensureClient();
      await client.del(key);
    } catch (error) {
      this.logger.warn(
        'Redis DEL operation failed:',
        (error as Error)?.message,
      );
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis not available for INCR operation');
      return 1; // Return 1 as fallback for first increment
    }
    try {
      const client = this.ensureClient();
      return await client.incr(key);
    } catch (error) {
      this.logger.warn(
        'Redis INCR operation failed:',
        (error as Error)?.message,
      );
      return 1; // Return 1 as fallback
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis not available for EXPIRE operation');
      return;
    }
    try {
      const client = this.ensureClient();
      await client.expire(key, ttl);
    } catch (error) {
      this.logger.warn(
        'Redis EXPIRE operation failed:',
        (error as Error)?.message,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis not available for EXISTS operation');
      return false;
    }
    try {
      const client = this.ensureClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(
        'Redis EXISTS operation failed:',
        (error as Error)?.message,
      );
      return false;
    }
  }
}
