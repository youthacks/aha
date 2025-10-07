import { Event } from './event.entity';
export declare class BuyingStation {
    id: string;
    event: Event;
    eventId: string;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
    createdAt: Date;
}
