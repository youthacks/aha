import { EventsService } from './events.service';
import { CreateEventDto, JoinEventDto, UpdateTokensDto, PromoteMemberDto } from './dto/event.dto';
import { CreateStationDto, PurchaseDto, UpdateStationDto } from './dto/station.dto';
import { UpdateEventSettingsDto } from './dto/update-event-settings.dto';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    createEvent(req: any, createEventDto: CreateEventDto): Promise<import("./entities/event.entity").Event>;
    joinEvent(req: any, joinEventDto: JoinEventDto): Promise<import("./entities/event-member.entity").EventMember>;
    getMyEvents(req: any): Promise<any[]>;
    getMyArchivedEvents(req: any): Promise<any[]>;
    getEventDetails(eventSlug: string, req: any): Promise<any>;
    updateTokens(eventSlug: string, req: any, updateDto: UpdateTokensDto): Promise<import("./entities/event-member.entity").EventMember>;
    promoteMember(eventSlug: string, req: any, promoteDto: PromoteMemberDto): Promise<import("./entities/event-member.entity").EventMember>;
    createStation(eventSlug: string, req: any, createDto: CreateStationDto): Promise<import("./entities/shop.entity").Shop>;
    updateStation(eventSlug: string, stationId: string, req: any, updateDto: UpdateStationDto): Promise<import("./entities/shop.entity").Shop>;
    deleteStation(eventSlug: string, stationId: string, req: any): Promise<{
        message: string;
    }>;
    purchase(eventSlug: string, req: any, purchaseDto: PurchaseDto): Promise<import("./entities/transaction.entity").Transaction>;
    getTransactions(eventSlug: string, req: any): Promise<import("./entities/transaction.entity").Transaction[]>;
    getAllTransactions(eventSlug: string, req: any): Promise<any[]>;
    updateEventSettings(eventSlug: string, req: any, updateDto: UpdateEventSettingsDto): Promise<import("./entities/event.entity").Event>;
    redeemReceipt(eventSlug: string, req: any, body: {
        receiptCode: string;
    }): Promise<any>;
    archiveEvent(eventSlug: string, req: any): Promise<{
        message: string;
    }>;
    unarchiveEvent(eventSlug: string, req: any): Promise<{
        message: string;
    }>;
    deleteEvent(eventSlug: string, req: any): Promise<{
        message: string;
    }>;
}
