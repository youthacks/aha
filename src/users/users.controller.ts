import { Controller, Get, Query, Delete } from '@nestjs/common';
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
}
