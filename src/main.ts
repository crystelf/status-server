import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import { GlobalExceptionFilter } from './filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Apply global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Get port from configuration
  const configService = app.get(ConfigService);
  const port = configService.getPort();

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Data retention: ${configService.getDataRetentionDays()} days`);
}
bootstrap();
