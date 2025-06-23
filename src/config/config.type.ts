import { DatabaseType } from 'typeorm';

export type AppConfig = {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
};

export type DatabaseConfig = {
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
};

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
};
