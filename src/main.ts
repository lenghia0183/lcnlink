import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<AllConfigType>);
  const configApp = configService.get('app', { infer: true });
  const { port } = configApp!;

  await app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}
bootstrap();
