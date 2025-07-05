import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import authConfig from '@config/auth.config';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import adminConfig from '@config/admin.config';
import mailConfig from '@config/mail.config';
import DatabaseConnectModule from '@database/database.connect.module';
import { RequestLoggingMiddleware } from '@core/middlewares/request-logging.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@components/user/user.module';
import { RepositoryModule } from '@database/repositories/repository.module';

import { AdminInitService } from 'src/services/admin-init.service';
import { ValidationPipe } from '@core/pipe/validation.pipe';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticateGuard } from '@core/guards/authenticate.guard';
import { AuthModule } from '@components/auth/auth.module';
import { I18nModule } from './i18n/i18n.module';
import { I18nService } from 'nestjs-i18n';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, adminConfig, mailConfig],
      envFilePath: ['.env'],
    }),
    JwtModule.register({}),
    DatabaseConnectModule,
    RepositoryModule,
    UserModule,
    AuthModule,
    I18nModule,
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
    AppService,
    AdminInitService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
