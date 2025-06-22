import { DataSourceOptions } from 'typeorm';

export type AppConfig = {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
};

export type DatabaseConfig = {
  type: DataSourceOptions['type'];
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
};

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
};
