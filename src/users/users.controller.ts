import { Controller, Get, Query, Delete, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from '../email/email.service';
import { ChangeEmailDto, VerifyEmailChangeDto } from './dto/change-email.dto';
import { RequestPasswordChangeDto, ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  @Get('debug')
  async debug(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { error: 'User not found' };
    }

    return {
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      verificationToken: user.verificationToken,
      verificationTokenExpiry: user.verificationTokenExpiry,
      hasToken: !!user.verificationToken,
      tokenExpired: user.verificationTokenExpiry ? new Date() > user.verificationTokenExpiry : null,
    };
  }

  @Get('list')
  async listAll() {
    const users = await this.usersService.findAll();
    const count = await this.usersService.count();
    return {
      count,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      })),
    };
  }

  @Delete('clear-all')
  async clearAll() {
    if (process.env.NODE_ENV !== 'development') {
      return { error: 'This endpoint is only available in development mode' };
    }

    const count = await this.usersService.count();
    await this.usersService.deleteAll();

    return {
      message: `Successfully deleted ${count} user(s)`,
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-email-change')
  async requestEmailChange(@Request() req, @Body() changeEmailDto: ChangeEmailDto) {
    const token = this.emailService.generateVerificationToken();
    const user = await this.usersService.requestEmailChange(req.user.userId, changeEmailDto.newEmail, token);

    await this.emailService.sendEmailChangeVerification(
      changeEmailDto.newEmail,
      token,
      user.firstName,
    );

    return {
      message: 'Verification email sent to your new email address. Please check your inbox.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-email-change')
  async verifyEmailChange(@Request() req, @Body() verifyDto: VerifyEmailChangeDto) {
    const user = await this.usersService.verifyEmailChange(req.user.userId, verifyDto.token);

    return {
      message: 'Email address changed successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-password-change')
  async requestPasswordChange(@Request() req, @Body() requestDto: RequestPasswordChangeDto) {
    const token = this.emailService.generateVerificationToken();
    const user = await this.usersService.requestPasswordChange(
      req.user.userId,
      requestDto.currentPassword,
      token,
    );

    await this.emailService.sendPasswordChangeConfirmation(
      user.email,
      token,
      user.firstName,
    );

    return {
      message: 'Confirmation email sent. Please check your inbox to complete the password change.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-password-change')
  async verifyPasswordChange(@Request() req, @Body() changeDto: ChangePasswordDto) {
    await this.usersService.verifyPasswordChange(
      req.user.userId,
      changeDto.token,
      changeDto.newPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }
}
