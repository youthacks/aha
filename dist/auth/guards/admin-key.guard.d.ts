import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AdminKeyGuard implements CanActivate {
    private readonly configService;
    constructor(configService: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
