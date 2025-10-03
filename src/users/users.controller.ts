import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
}


