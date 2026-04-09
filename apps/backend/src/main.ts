import { NestFactory } from '@nestjs/core';
import { AppModule } from 'app.module';
import { AUTH_GUARD } from 'auth.middleware';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      colors: true,
      prefix: 'Server',
      timestamp: true,
      logLevels: ['log', 'warn', 'error', 'fatal', 'debug'],
      compact: true,
    }),
    bufferLogs: true,
  });

  // app.use(AUTH_GUARD);

  await app.listen(process.env.PORT ?? 8080);
  console.log(`Server is running on http://localhost:${process.env.PORT ?? 8080}/`);
}

bootstrap();
