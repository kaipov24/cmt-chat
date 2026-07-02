import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { uploadsRootDirectory } from './users/avatar-storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
  const port = Number(config.get<string>('PORT') ?? 4000);

  app.useStaticAssets(uploadsRootDirectory, {
    prefix: '/uploads/',
  });
  app.enableCors({
    credentials: true,
    origin: frontendOrigin,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(port);
}

void bootstrap();
