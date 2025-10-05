import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
import { Shop } from './shop.entity';

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

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  type: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  stationId: string;

  @ManyToOne(() => Shop, { nullable: true })
  station: Shop;

  @Column({ nullable: true })
  receiptCode: string;

  @Column({ default: false })
  isRedeemed: boolean;

  @Column({ nullable: true })
  redeemedAt: Date;

  @Column({ nullable: true })
  redeemedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
