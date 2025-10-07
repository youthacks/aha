import { UsersService } from './users/users.service';
import { EventsService } from './events/events.service';
export declare class AppController {
    private usersService;
    private eventsService;
    constructor(usersService: UsersService, eventsService: EventsService);
    getHello(): {
        message: string;
        version: string;
        endpoints: {
            auth: {
                register: string;
                login: string;
                verifyEmail: string;
                resendVerification: string;
                forgotPassword: string;
                resetPassword: string;
                profile: string;
            };
            admin: {
                resetDatabase: string;
            };
        };
    };
    health(): {
        status: string;
        timestamp: string;
    };
    resetDatabase(): Promise<{
        message: string;
        details: {
            users: string;
            events: string;
            eventMembers: string;
            buyingStations: string;
            transactions: string;
        };
        timestamp: string;
    }>;
}
