import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const allowedOrigins = (
    // "null" is the explicit origin sent when the static frontend is opened
    // directly from disk (file://). It remains an exact allow-list entry.
    process.env.CORS_ORIGINS ||
    'http://localhost:8081,http://127.0.0.1:8081,null'
  )
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('IdeaBox API')
    .setDescription("API personnelle de maturation d'idées")
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
