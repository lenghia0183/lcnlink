import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { ConfigService } from '@nestjs/config';
import { BusinessExceptionFilter } from '@core/exception-filters/business-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<AllConfigType>);

  const appConfig = configService.get('app', { infer: true });
  const { port, appName, apiPrefix } = appConfig!;

  app.setGlobalPrefix(apiPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription('Tai lieu REST API cho he thong LCNLink')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalFilters(new BusinessExceptionFilter());
  await app.listen(port, () => {
    console.log(`🚀 Server is running on port: ${port}`);
    console.log(`📘 Swagger available at http://localhost:${port}/api-docs`);
  });
}
bootstrap().catch((err) => {
  console.error('❌  Failed to start Nest application', err);
  process.exit(1);
});
