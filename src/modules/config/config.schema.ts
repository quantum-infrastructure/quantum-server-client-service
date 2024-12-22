export interface AppConfig {
  environment: string;
  apiPort: number;
  redis: {
    redisHost: string;
    redisPort: number;
  };
  authentication: {
    lambdaFunctionArn: string;
  };
  aws: {
    region: string;
  };
}
