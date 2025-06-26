import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

import authConfig from '@config/auth.config';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import DatabaseConnectModule from '@database/database.connect.module';
import { RequestLoggingMiddleware } from '@core/middlewares/request-logging.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@components/user/user.module';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { AllConfigType } from '@config/config.type';
import * as path from 'path';
import { ValidationPipe } from '@core/pipe/validation.pipe';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      envFilePath: ['.env'],
    }),
    JwtModule.register({}),
    DatabaseConnectModule,
    UserModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loader: I18nJsonLoader,
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        new CookieResolver(),
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'APP_PIPE',
      useClass: ValidationPipe,
    },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
