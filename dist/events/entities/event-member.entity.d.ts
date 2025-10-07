import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
export declare enum EventRole {
    MEMBER = "member",
    MANAGER = "manager",
    OWNER = "owner"
}
export declare class EventMember {
    id: string;
    event: Event;
    eventId: string;
    user: User;
    userId: string;
    tokens: number;
    role: EventRole;
    joinedAt: Date;
    updatedAt: Date;
}
