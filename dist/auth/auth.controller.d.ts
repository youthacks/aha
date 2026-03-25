import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private authService;
    private jwtService;
    constructor(authService: AuthService, jwtService: JwtService);
    private getOAuthCookieOptions;
    private resolveAuthenticatedUserId;
    private parseCookie;
    private base64UrlEncode;
    private buildPkcePair;
    private getBackendBaseUrl;
    private getFrontendBaseUrl;
    private isDevOAuthDebugMode;
    private maskValue;
    private logOAuthDebug;
    private quoteForSingleQuotedShell;
    private buildTokenCurlCommand;
    private getYouthacksCallbackUrl;
    private resolveOidcConfig;
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
    redirectToYouthacks(req: any, res: Response): Promise<void>;
    getYouthacksAuthorizationUrl(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getYouthacksLinkAuthorizationUrl(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    private exchangeYouthacksAuthorizationCode;
    exchangeYouthacksCode(req: any, code: string, state: string, res: Response): Promise<Response<any, Record<string, any>>>;
    private buildOAuthErrorRedirect;
    private handleYouthacksCallback;
    YouthacksCallback(req: any, code: string, state: string, res: Response): Promise<void>;
    youthacksIntegrationCallback(req: any, code: string, state: string, res: Response): Promise<void>;
}
