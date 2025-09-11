import { DatabaseType } from 'typeorm';
import { MailConfig } from './mail.config';

export type AppConfig = {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  fallbackLanguage: string;
  appName: string;
  frontendUrl: string;
  backendUrl: string;
};

export type DatabaseConfig = {
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
};

export type AuthConfig = {
  accessSecret?: string;
  accessExpires?: string;
  refreshSecret?: string;
  refreshExpires?: string;
  otpTokenSecret?: string;
  otpTokenExpires?: string;
  forgotPasswordSecret?: string;
  forgotPasswordExpires?: string;
  verifyEmailSecret?: string;
  verifyEmailExpires?: string;

  google: {
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };

  facebook: {
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };
};

export type AdminConfig = {
  name: string;
  email: string;
  password: string;
};

export type AwsConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  s3BucketName: string;
};

export type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  db: number;
};

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  admin: AdminConfig;
  mail: MailConfig;
  redis: RedisConfig;
  aws: AwsConfig;
};
