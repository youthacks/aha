import { Event } from './event.entity';
export declare class Shop {
    id: string;
    event: Event;
    eventId: string;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
    stock: number;
    purchaseLimit: number;
    imageUrl: string;
    createdAt: Date;
}
