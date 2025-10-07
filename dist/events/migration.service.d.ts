import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
export declare class MigrationService {
    private eventsRepository;
    constructor(eventsRepository: Repository<Event>);
    generateSlug(name: string): string;
    migrateCodeToSlug(): Promise<{
        success: boolean;
        message: string;
        migratedCount: number;
    }>;
}
