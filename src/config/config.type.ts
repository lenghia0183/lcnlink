export type AppConfig = {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
};

export type AllConfigType = {
  app: AppConfig;
};
