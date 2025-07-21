import { IsNotEmpty, IsString } from 'class-validator';
import { registerAs } from '@nestjs/config';
import validateConfig from 'src/utils/validate-config';
import { AwsConfig } from './config.type';

class AwsEnvValidator {
  @IsString()
  @IsNotEmpty()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  AWS_REGION: string;

  @IsString()
  @IsNotEmpty()
  AWS_S3_BUCKET_NAME: string;
}

export default registerAs<AwsConfig>('aws', () => {
  validateConfig(process.env, AwsEnvValidator);

  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.AWS_S3_BUCKET_NAME || '',
  };
});
