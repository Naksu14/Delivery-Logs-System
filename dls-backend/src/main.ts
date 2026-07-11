import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule) as NestExpressApplication;
  const uploadRoot = join(__dirname, '..', 'uploads');
  const proofImageDir = join(uploadRoot, 'proof-images');

  if (!existsSync(proofImageDir)) {
    mkdirSync(proofImageDir, { recursive: true });
  }

  app.useStaticAssets(uploadRoot, { prefix: '/uploads/' });

  app.enableCors({
    origin: ['http://localhost:5185', 'http://192.168.200.15:5185', 'http://192.168.110.50:5185'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3014);
}
bootstrap();
