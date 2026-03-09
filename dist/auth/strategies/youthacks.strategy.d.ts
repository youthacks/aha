import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const YouthacksStrategy_base: new (...args: any[]) => any;
export declare class YouthacksStrategy extends YouthacksStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(accessToken: string, refreshToken: string, profile: any, done: Function): Promise<void>;
}
export {};
