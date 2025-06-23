import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import authConfig from '@config/auth.config';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import DatabaseConnectModule from '@database/database.connect.module';
import { RequestLoggingMiddleware } from '@core/middlewares/request-logging.middleware';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      envFilePath: ['.env'],
    }),
    JwtModule.register({}),
    DatabaseConnectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
