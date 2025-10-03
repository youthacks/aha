import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EventMember } from './event-member.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, length: 5 })
  code: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User)
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => EventMember, member => member.event)
  members: EventMember[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

