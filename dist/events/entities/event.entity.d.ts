import { User } from '../../users/entities/user.entity';
import { EventMember } from './event-member.entity';
export declare class Event {
    id: string;
    name: string;
    slug: string;
    joinCode: string;
    description: string;
    owner: User;
    ownerId: string;
    members: EventMember[];
    isActive: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}
