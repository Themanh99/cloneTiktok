import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Global prefix: all APIs will start with '/api'
  app.setGlobalPrefix('api');

  // 2. CORS configuration
  // Allow frontend to access backend (e.g. localhost:5173 → localhost:3000)
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true, // Allow sending cookies (auth) in request headers
  });

  // 3. Global validation pipeline
  // Automatically validates data in request body / query / params
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip fields not defined in the DTO
      forbidNonWhitelisted: true, // Return error if unknown fields are sent
      transform: true, // Auto-cast types (e.g. string → number)
    }),
  );

  // 4. Global exception filter — ensures all errors share a consistent format
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  Logger.log(`Application is running on: ${port}`);
}
bootstrap();
