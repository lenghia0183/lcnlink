import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { UserModule } from '@components/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
