import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import { GlobalExceptionFilter } from './filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Apply global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Get configuration
  const configService = app.get(ConfigService);
  const port = configService.getPort();
  const corsConfig = configService.getCors();

  // Configure CORS
  if (corsConfig !== false) {
    if (corsConfig === true) {
      // Enable CORS for all origins (development mode)
      app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
      });
      console.log('CORS enabled for all origins');
    } else if (Array.isArray(corsConfig) && corsConfig.length > 0) {
      // Enable CORS for specific origins
      app.enableCors({
        origin: corsConfig,
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
      });
      console.log(`CORS enabled for origins: ${corsConfig.join(', ')}`);
    } else {
      // Default: enable for all (backward compatibility)
      app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
      });
      console.log('CORS enabled for all origins (default)');
    }
  } else {
    console.log('CORS disabled');
  }

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Data retention: ${configService.getDataRetentionDays()} days`);
}
bootstrap();
