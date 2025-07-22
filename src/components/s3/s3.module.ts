import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { S3Service } from './s3.service';
import { S3Controller } from './s3.controller';
import { RepositoryModule } from '@database/repositories/repository.module';
import { I18nModule } from '../../i18n/i18n.module';
import { FileValidationInterceptor } from '@core/interceptors/file-validation.interceptor';

@Module({
  imports: [ConfigModule, JwtModule, RepositoryModule, I18nModule],
  controllers: [S3Controller],
  providers: [S3Service, FileValidationInterceptor],
  exports: [S3Service, FileValidationInterceptor],
})
export class S3Module {}
