import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in');
    }

    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const verificationToken = this.emailService.generateVerificationToken();

    const user = await this.usersService.create(createUserDto, verificationToken);

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName,
    );

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async verifyEmail(email: string, token: string) {
    const user = await this.usersService.verifyEmail(email, token);

    const payload = { email: user.email, sub: user.id };

    return {
      message: 'Email verified successfully. You can now login.',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = this.emailService.generateVerificationToken();

    await this.usersService.updateVerificationToken(email, verificationToken);

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName,
    );

    return {
      message: 'Verification email sent. Please check your email.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const resetToken = this.emailService.generateVerificationToken();

    await this.usersService.setPasswordResetToken(email, resetToken);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName,
    );

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    await this.usersService.resetPassword(email, token, newPassword);

    return {
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }

  async linkYouthacksAccount(userId: string, providerId: string) {
    await this.usersService.setYouthacksSettings(userId, true, providerId);

    return {
      message: 'Youthacks account linked successfully',
    };
  }

  // OAuth login helper
  async validateOAuthLogin(provider: string, accessToken: string, profile: any) {
    // profile may differ depending on provider; try to extract email and name
    const email = profile.email || (profile.emails && profile.emails[0] && profile.emails[0].value);
    const firstName = profile.given_name || profile.firstName || profile.name?.givenName || profile.displayName?.split(' ')[0];
    const lastName = profile.family_name || profile.lastName || profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ');

    if (!email) {
      throw new UnauthorizedException('No email returned from OAuth provider');
    }

    // Only allow logging in with OAuth for existing users who have enabled Youthacks OAuth
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('No account exists for this OAuth user');
    }

    const youthacksAccessEnabled = user.youthacksEnabled || !!user.youthacksId;

    if (!youthacksAccessEnabled) {
      throw new ForbiddenException('Youthacks OAuth is not enabled for this account. Enable it in Settings first.');
    }

    const providerId = profile.sub || profile.id;
    if (!providerId) {
      throw new UnauthorizedException('OAuth profile did not include a subject identifier');
    }

    if (!user.youthacksId) {
      throw new ForbiddenException('Youthacks account is not linked. Connect your account in Settings first.');
    }

    if (user.youthacksId !== providerId) {
      throw new ForbiddenException('Connected Youthacks account does not match this login. Reconnect the correct account in Settings.');
    }

    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}
