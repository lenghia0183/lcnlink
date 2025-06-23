import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';

import { AuthConfig } from './config.type';
import validateConfig from '@utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  AUTH_ACCESS_SECRET: string;

  @IsString()
  AUTH_ACCESS_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_REFRESH_SECRET: string;

  @IsString()
  AUTH_REFRESH_TOKEN_EXPIRES_IN: string;
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    accessSecret: process.env.AUTH_ACCESS_SECRET,
    accessExpires: process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN,
    refreshSecret: process.env.AUTH_REFRESH_SECRET,
    refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
  };
});
