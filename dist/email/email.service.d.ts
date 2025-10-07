import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendVerificationEmail(email: string, token: string, firstName?: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<void>;
    generateVerificationToken(): string;
    sendEmailChangeVerification(newEmail: string, token: string, firstName?: string): Promise<void>;
    sendPasswordChangeConfirmation(email: string, token: string, firstName?: string): Promise<void>;
}
