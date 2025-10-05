import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RequestPasswordChangeDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, verificationToken: string): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
      isEmailVerified: false,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async verifyEmail(email: string, token: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        email,
        verificationToken: token,
        verificationTokenExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;

    return this.usersRepository.save(user);
  }

  async updateVerificationToken(email: string, token: string): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    user.verificationToken = token;
    user.verificationTokenExpiry = verificationTokenExpiry;

    return this.usersRepository.save(user);
  }

  async setPasswordResetToken(email: string, token: string): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetPasswordExpiry = new Date();
    resetPasswordExpiry.setHours(resetPasswordExpiry.getHours() + 1);

    user.resetPasswordToken = token;
    user.resetPasswordExpiry = resetPasswordExpiry;

    return this.usersRepository.save(user);
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        email,
        resetPasswordToken: token,
        resetPasswordExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    return this.usersRepository.save(user);
  }

  async deleteAll(): Promise<void> {
    await this.usersRepository.clear();
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'isEmailVerified', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async requestEmailChange(userId: string, newEmail: string, token: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const emailChangeTokenExpiry = new Date();
    emailChangeTokenExpiry.setHours(emailChangeTokenExpiry.getHours() + 1);

    user.pendingEmail = newEmail;
    user.emailChangeToken = token;
    user.emailChangeTokenExpiry = emailChangeTokenExpiry;

    return this.usersRepository.save(user);
  }

  async verifyEmailChange(userId: string, token: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
        emailChangeToken: token,
        emailChangeTokenExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired email change token');
    }

    if (!user.pendingEmail) {
      throw new BadRequestException('No pending email change');
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeTokenExpiry = null;
    user.isEmailVerified = true;

    return this.usersRepository.save(user);
  }

  async requestPasswordChange(userId: string, currentPassword: string, token: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordChangeTokenExpiry = new Date();
    passwordChangeTokenExpiry.setHours(passwordChangeTokenExpiry.getHours() + 1);

    user.passwordChangeToken = token;
    user.passwordChangeTokenExpiry = passwordChangeTokenExpiry;

    return this.usersRepository.save(user);
  }

  async verifyPasswordChange(userId: string, token: string, newPassword: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
        passwordChangeToken: token,
        passwordChangeTokenExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password change token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordChangeToken = null;
    user.passwordChangeTokenExpiry = null;

    return this.usersRepository.save(user);
  }

  async changeEmail(userId: string, changeEmailDto: ChangeEmailDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: changeEmailDto.newEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    user.email = changeEmailDto.newEmail;
    user.isEmailVerified = false;

    await this.usersRepository.save(user);

    return { message: 'Email updated successfully' };
  }

  async changePassword(userId: string, changePasswordDto: RequestPasswordChangeDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    user.password = hashedNewPassword;

    await this.usersRepository.save(user);

    return { message: 'Password updated successfully' };
  }
}
