import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // ─── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());

  // ─── Rate limiting ───────────────────────────────────────────────────────────
  // Global: 200 reqs per minute per IP
  app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false }));
  // Auth endpoints: stricter — 10 attempts per 15 min
  app.use('/auth', rateLimit({ windowMs: 15 * 60_000, max: 10, message: { error: 'Too many auth attempts. Try again in 15 minutes.' } }));
  // Public chat ingest: 30 messages per minute per IP
  app.use('/companies/anchor', rateLimit({ windowMs: 60_000, max: 30 }));

  const frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  const corsOrigins = [frontendUrl];
  // In development, also allow localhost variants
  if (process.env.NODE_ENV !== 'production') {
    corsOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002');
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
  });

  // ─── Raw body preservation for HMAC webhook signature verification ────────────
  // These middleware must be registered BEFORE NestJS applies its global JSON parser.
  app.use('/channels/whatsapp/webhook', express.raw({ type: '*/*' }));
  app.use('/channels/instagram/webhook', express.raw({ type: '*/*' }));
  app.use('/channels/facebook/webhook', express.raw({ type: '*/*' }));
  app.use('/payments/webhook/paystack', express.raw({ type: '*/*' }));

  // URL-encoded body for Africa's Talking SMS inbound parse
  app.use('/channels/sms/inbound', express.urlencoded({ extended: true }));

  // ─── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  // ─── Graceful shutdown ───────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
