import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { ConfigService } from '@nestjs/config';
import { BusinessExceptionFilter } from '@core/exception-filters/business-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<AllConfigType>);
  const configApp = configService.get('app', { infer: true });
  const { port } = configApp!;

  app.useGlobalFilters(new BusinessExceptionFilter());
  await app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}
bootstrap();
