import { UsersService } from './users.service';
import { EmailService } from '../email/email.service';
import { ChangeEmailDto, VerifyEmailChangeDto } from './dto/change-email.dto';
import { RequestPasswordChangeDto, ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private usersService;
    private emailService;
    constructor(usersService: UsersService, emailService: EmailService);
    debug(email: string): Promise<{
        error: string;
        email?: undefined;
        isEmailVerified?: undefined;
        verificationToken?: undefined;
        verificationTokenExpiry?: undefined;
        hasToken?: undefined;
        tokenExpired?: undefined;
    } | {
        email: string;
        isEmailVerified: boolean;
        verificationToken: string;
        verificationTokenExpiry: Date;
        hasToken: boolean;
        tokenExpired: boolean;
        error?: undefined;
    }>;
    listAll(): Promise<{
        count: number;
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: boolean;
            createdAt: Date;
        }[];
    }>;
    clearAll(): Promise<{
        error: string;
        message?: undefined;
        success?: undefined;
    } | {
        message: string;
        success: boolean;
        error?: undefined;
    }>;
    requestEmailChange(req: any, changeEmailDto: ChangeEmailDto): Promise<{
        message: string;
    }>;
    verifyEmailChange(req: any, verifyDto: VerifyEmailChangeDto): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    requestPasswordChange(req: any, requestDto: RequestPasswordChangeDto): Promise<{
        message: string;
    }>;
    verifyPasswordChange(req: any, changeDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
