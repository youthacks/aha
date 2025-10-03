import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
}
