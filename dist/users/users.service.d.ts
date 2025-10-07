import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RequestPasswordChangeDto } from './dto/change-password.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(createUserDto: CreateUserDto, verificationToken: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    verifyEmail(email: string, token: string): Promise<User>;
    updateVerificationToken(email: string, token: string): Promise<User>;
    setPasswordResetToken(email: string, token: string): Promise<User>;
    resetPassword(email: string, token: string, newPassword: string): Promise<User>;
    deleteAll(): Promise<void>;
    count(): Promise<number>;
    findAll(): Promise<User[]>;
    requestEmailChange(userId: string, newEmail: string, token: string): Promise<User>;
    verifyEmailChange(userId: string, token: string): Promise<User>;
    requestPasswordChange(userId: string, currentPassword: string, token: string): Promise<User>;
    verifyPasswordChange(userId: string, token: string, newPassword: string): Promise<User>;
    changeEmail(userId: string, changeEmailDto: ChangeEmailDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, changePasswordDto: RequestPasswordChangeDto): Promise<{
        message: string;
    }>;
}
