import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';
import { registerAs } from '@nestjs/config';
import validateConfig from 'src/utils/validate-config';
import { getValueOrDefault } from 'src/utils/common';

export type MailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  fromName: string;
};

class MailEnvValidator {
  @IsString()
  @IsNotEmpty()
  MAIL_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsNotEmpty()
  MAIL_PORT: number;

  @IsString()
  @IsNotEmpty()
  MAIL_USER: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM: string;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM_NAME: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, MailEnvValidator);

  return {
    host: process.env.MAIL_HOST || '',
    port: getValueOrDefault(process.env.MAIL_PORT, 587),
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || '',
    fromName: process.env.MAIL_FROM_NAME || '',
  };
});
