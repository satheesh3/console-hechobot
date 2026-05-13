import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { json, raw } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  app.use(helmet());

  // Capture raw body for YCloud webhook signature verification.
  app.use('/webhooks/ycloud', raw({ type: '*/*' }));
  app.use(json({ limit: '2mb' }));

  app.setGlobalPrefix('', { exclude: ['/health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('app.port', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`WhatsApp reseller API listening on :${port}`);
}

bootstrap();
