import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { EventsModule } from './events/events.module';
import { AppController } from './app.controller';
import { User } from './users/entities/user.entity';
import { Event } from './events/entities/event.entity';
import { EventMember } from './events/entities/event-member.entity';
import { Shop } from './events/entities/shop.entity';
import { Transaction } from './events/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Event, EventMember, Shop, Transaction],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    EmailModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
