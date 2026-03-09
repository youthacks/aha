import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private buildYouthacksAuthorizationUrl;
    register(createUserDto: CreateUserDto): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: boolean;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: true;
        };
    }>;
    verifyEmail(email: string, token: string): Promise<{
        message: string;
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: boolean;
        };
    }>;
    resendVerification(resendDto: ResendVerificationDto): Promise<{
        message: string;
    }>;
    forgotPassword(forgotDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: any): any;
    redirectToYouthacks(res: Response): void;
    getYouthacksAuthorizationUrl(res: Response): Response<any, Record<string, any>>;
    YouthacksCallback(req: any, code: string, state: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
