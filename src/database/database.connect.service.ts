import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AllConfigType } from 'src/config/config.type';

@Injectable()
export default class DatabaseConnectService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databaseConfig = this.configService.get('database', { infer: true });
    const { type, host, port, username, password, database, ssl } =
      databaseConfig!;
    return {
      type: 'postgres',
      url: this.buildConnectionString({
        type,
        host,
        port,
        username,
        password,
        database,
      }),

      synchronize: false,
      logging: false,
      autoLoadEntities: true,
      ssl: ssl ? { rejectUnauthorized: false } : false,
    };
  }

  private buildConnectionString({
    type,
    host,
    port,
    username,
    password,
    database,
  }: {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  }): string {
    return `${type}://${username}:${password}@${host}:${port}/${database}`;
  }
}
