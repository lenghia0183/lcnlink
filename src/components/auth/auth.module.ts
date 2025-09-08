import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; // 👈 thêm
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@components/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { RepositoryModule } from '@database/repositories/repository.module';
import { MailModule } from '@components/mail/mail.module';
import { RedisService } from '@core/services/redis.service';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    RepositoryModule,
    UserModule,
    ConfigModule,
    JwtModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
