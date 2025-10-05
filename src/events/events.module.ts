import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { EventMember } from './entities/event-member.entity';
import { Shop } from './entities/shop.entity';
import { Transaction } from './entities/transaction.entity';
import { UsersModule } from '../users/users.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventMember, Shop, Transaction]),
    UsersModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
