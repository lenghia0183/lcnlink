import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';

import { AuthConfig } from './config.type';
import validateConfig from '@utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  AUTH_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  AUTH_ACCESS_TOKEN_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  AUTH_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  AUTH_REFRESH_TOKEN_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  OTP_TOKEN_SECRET: string;

  @IsString()
  @IsNotEmpty()
  OTP_TOKEN_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  FORGOT_PASSWORD_TOKEN_SECRET: string;

  @IsString()
  @IsNotEmpty()
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: string;
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    accessSecret: process.env.AUTH_ACCESS_SECRET,
    accessExpires: process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN,
    refreshSecret: process.env.AUTH_REFRESH_SECRET,
    refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
    otpTokenSecret: process.env.OTP_TOKEN_SECRET,
    otpTokenExpires: process.env.OTP_TOKEN_EXPIRES_IN,
    forgotPasswordSecret: process.env.FORGOT_PASSWORD_TOKEN_SECRET,
    forgotPasswordExpires: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,
  };
});
