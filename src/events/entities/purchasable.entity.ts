import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity('purchasables')
export class Purchasable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event)
  event: Event;

  @Column()
  eventId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  price: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true, type: 'text' })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
