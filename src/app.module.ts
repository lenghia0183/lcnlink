import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import authConfig from '@config/auth.config';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import adminConfig from '@config/admin.config';
import mailConfig from '@config/mail.config';
import redisConfig from '@config/redis.config';
import awsConfig from '@config/aws.config';
import DatabaseConnectModule from '@database/database.connect.module';
import { RequestLoggingMiddleware } from '@core/middlewares/request-logging.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@components/user/user.module';
import { LinkModule } from '@components/link/link.module';
import { RepositoryModule } from '@database/repositories/repository.module';

import { AdminInitService } from '@core/services/admin-init.service';
import { ValidationPipe } from '@core/pipes/validation.pipe';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticateGuard } from '@core/guards/authenticate.guard';
import { CustomThrottlerGuard } from '@core/guards/custom-throttler.guard';
import { AuthModule } from '@components/auth/auth.module';
import { S3Module } from '@components/s3/s3.module';
import { I18nModule } from './i18n/i18n.module';
import { I18nService } from 'nestjs-i18n';
import { RedisModule } from '@core/modules/redis/redis.module';
import { CustomThrottlerModule } from '@core/modules/throttler/throttler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        adminConfig,
        mailConfig,
        redisConfig,
        awsConfig,
      ],
      envFilePath: ['.env'],
    }),
    JwtModule.register({}),
    DatabaseConnectModule,
    RepositoryModule,
    UserModule,
    LinkModule,
    AuthModule,
    S3Module,
    I18nModule,
    RedisModule,
    CustomThrottlerModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'APP_PIPE',
      useFactory: (i18nService: I18nService) => {
        return new ValidationPipe(i18nService, {
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          enableDebugMessages: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        });
      },
      inject: [I18nService],
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticateGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    AppService,
    AdminInitService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
