import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Unique } from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

export enum EventRole {
  MEMBER = 'member',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

@Entity('event_members')
@Unique(['event', 'user'])
export class EventMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, event => event.members)
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({ default: 0 })
  tokens: number;

  @Column({
    type: 'enum',
    enum: EventRole,
    default: EventRole.MEMBER,
  })
  role: EventRole;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

