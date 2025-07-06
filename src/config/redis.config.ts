import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { registerAs } from '@nestjs/config';
import validateConfig from 'src/utils/validate-config';
import { getValueOrDefault } from 'src/utils/common';
import { RedisConfig } from './config.type';

class RedisEnvValidator {
  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB?: number;
}

export default registerAs<RedisConfig>('redis', () => {
  // Only validate if Redis environment variables are provided
  const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_PORT;

  if (hasRedisConfig) {
    validateConfig(process.env, RedisEnvValidator);
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: getValueOrDefault(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD,
    db: getValueOrDefault(process.env.REDIS_DB, 0),
  };
});
