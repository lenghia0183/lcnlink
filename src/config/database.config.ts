import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { registerAs } from '@nestjs/config';
import validateConfig from 'src/utils/validate-config';
import { getValueOrDefault } from 'src/utils/common';
import { DatabaseConfig } from './config.type';
import { DataSourceOptions } from 'typeorm';

export enum DatabaseType {
  MySQL = 'mysql',
  Postgres = 'postgres',
  SQLite = 'sqlite',
  MongoDB = 'mongodb',
  MSSQL = 'mssql',
}

class DatabaseEnvValidator {
  @IsEnum(DatabaseType)
  @IsNotEmpty()
  DB_TYPE: DatabaseType;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsNotEmpty()
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsBoolean()
  DB_SSL: boolean;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, DatabaseEnvValidator);

  return {
    type: process.env.DB_TYPE as DataSourceOptions['type'],
    host: process.env.DB_HOST || '',
    port: getValueOrDefault(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    ssl: process.env.DB_SSL === 'true',
  };
});
