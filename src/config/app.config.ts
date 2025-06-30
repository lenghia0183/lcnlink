import { Min, Max, IsInt, IsEnum, IsString, IsOptional } from 'class-validator';

import validateConfig from 'src/utils/validate-config';
import { AppConfig } from './config.type';
import { getValueOrDefault } from 'src/utils/common';
import { registerAs } from '@nestjs/config';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  FALLBACK_LANGUAGE: string;

  @IsString()
  APP_NAME: string;
}
export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: getValueOrDefault(process.env.APP_PORT ?? process.env.PORT, 3001),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'vi',
    appName: process.env.APP_NAME || 'lcnlink',
  };
});
