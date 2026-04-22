import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Global prefix : all api will start with '/api'
  app.setGlobalPrefix('api');

  // 2. Config CORS
  // Allow frontend to access backend (localhost 5173 call to localhost 3000)

  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true, // Allow send cookies (auth) to header request
  });

  // 3. Validate global pipeline
  // Tự động validate data in request body / query / param
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove field không có trong DTO
      forbidNonWhitelisted: true, // Return error nếu có field lạ
      transform: true, // Tự động chuyển type (vd string → number)
    }),
  );

  // 4. Global exception filter Format lỗi trả ra thống nhất nhau
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Shutdown hooks :
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  Logger.log(`Application is running on: ${port}`);
}
bootstrap();
