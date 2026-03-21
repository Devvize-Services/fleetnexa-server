/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config.js';
import * as crypto from 'node:crypto';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  if (!(globalThis as any).crypto) {
    (globalThis as any).crypto = crypto;
  }

  const config = new DocumentBuilder()
    .setTitle('FleetNexa API')
    .setDescription('FleetNexa API documentation')
    .setVersion('1.0')
    .addTag('fleetnexa')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, documentFactory);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedDomains = [
        'localhost:3000',
        'localhost:5173',
        'localhost:5174',
        'rentnexa.com',
        'www.rentnexa.com',
        'fleetnexa.com',
        'www.fleetnexa.com',
        'devvize.com',
        'www.devvize.com',
      ];

      const isAllowed = allowedDomains.some((domain) =>
        origin.endsWith(domain),
      );

      callback(null, isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-timestamp',
      'x-api-key',
      'x-signature',
      'x-admin-token',
      'x-auth-token',
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
