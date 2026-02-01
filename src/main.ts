import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EventsService } from './events/events.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  try {
    const eventsService = app.get(EventsService);
    const updatedCount = await eventsService.backfillJoinCodes();
    if (updatedCount > 0) {
      console.log(`Backfilled join codes for ${updatedCount} event(s).`);
    }
  } catch (error) {
    console.error('Failed to backfill join codes:', error);
  }

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();

