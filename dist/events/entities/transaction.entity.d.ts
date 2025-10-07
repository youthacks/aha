import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
import { Shop } from './shop.entity';
export declare class Transaction {
    id: string;
    event: Event;
    eventId: string;
    user: User;
    userId: string;
    amount: number;
    type: string;
    description: string;
    stationId: string;
    station: Shop;
    receiptCode: string;
    isRedeemed: boolean;
    redeemedAt: Date;
    redeemedBy: string;
    createdAt: Date;
}
