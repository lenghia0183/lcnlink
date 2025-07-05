import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@components/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RepositoryModule } from '@database/repositories/repository.module';
import { MailModule } from '@components/mail/mail.module';

@Module({
  imports: [RepositoryModule, UserModule, ConfigModule, JwtModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
