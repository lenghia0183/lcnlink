import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import DatabaseConnectService from './database.connect.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConnectService,
      inject: [DatabaseConnectService],
    }),
  ],
  providers: [DatabaseConnectService],
  exports: [DatabaseConnectService],
})
export default class DatabaseConnectModule {}
