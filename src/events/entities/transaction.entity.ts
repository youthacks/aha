import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
import { BuyingStation } from './buying-station.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event)
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column()
  amount: number;

  @Column()
  type: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => BuyingStation, { nullable: true })
  station: BuyingStation;

  @Column({ nullable: true })
  stationId: string;

  @CreateDateColumn()
  createdAt: Date;
}

