import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip unknown keys and reject them outright, so a typo'd field is a
      // 400 rather than a value that silently does nothing.
      whitelist: true,
      forbidNonWhitelisted: true,
      // Run class-transformer so @Type coercion applies to query params.
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const origins = config
    .get<string>('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Lets Mongoose close its connection pool cleanly on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 4000);
  // Bind to all interfaces: hosted platforms (Render, Railway, Fly) route
  // traffic in from outside the container, and the default localhost-only
  // binding makes the service unreachable — health checks fail and the deploy
  // is rolled back as unhealthy.
  await app.listen(port, '0.0.0.0');

  Logger.log(`API listening on port ${port}, base path /api`, 'Bootstrap');
}

void bootstrap();
