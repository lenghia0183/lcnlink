import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { registerAs } from '@nestjs/config';
import validateConfig from 'src/utils/validate-config';
import { AdminConfig } from './config.type';

class AdminEnvValidator {
  @IsNotEmpty()
  @IsString()
  ADMIN_NAME: string;

  @IsEmail()
  @IsNotEmpty()
  ADMIN_EMAIL: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_PASSWORD: string;
}

export default registerAs<AdminConfig>('admin', () => {
  validateConfig(process.env, AdminEnvValidator);

  return {
    name: process.env.ADMIN_NAME || 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  };
});
