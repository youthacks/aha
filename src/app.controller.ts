import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { EventsService } from './events/events.service';

@Controller()
export class AppController {
  constructor(
    private usersService: UsersService,
    private eventsService: EventsService,
  ) {}

  @Get()
  getHello() {
    return {
      message: 'AHA-V2 API is running',
      version: '1.0.0',
      endpoints: {
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          verifyEmail: 'GET /auth/verify-email?email=xxx&token=xxx',
          resendVerification: 'POST /auth/resend-verification',
          forgotPassword: 'POST /auth/forgot-password',
          resetPassword: 'POST /auth/reset-password',
          profile: 'GET /auth/profile (requires JWT token)',
        },
        admin: {
          resetDatabase: 'POST /reset-database',
        },
      },
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset-database')
  @HttpCode(200)
  async resetDatabase() {
    await this.eventsService.deleteAll();
    await this.usersService.deleteAll();

    return {
      message: 'Database reset successfully',
      details: {
        users: 'deleted',
        events: 'deleted',
        eventMembers: 'deleted',
        buyingStations: 'deleted',
        transactions: 'deleted',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
