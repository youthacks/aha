export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    verificationToken: string;
    verificationTokenExpiry: Date;
    resetPasswordToken: string;
    resetPasswordExpiry: Date;
    pendingEmail: string;
    emailChangeToken: string;
    emailChangeTokenExpiry: Date;
    passwordChangeToken: string;
    passwordChangeTokenExpiry: Date;
    createdAt: Date;
    updatedAt: Date;
}
