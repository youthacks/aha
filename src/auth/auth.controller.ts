import { Controller, Post, Body, UseGuards, Request, Get, Query, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private buildYouthacksAuthorizationUrl(res: Response): string {
    const base = process.env.YOUTHACKS_BASE_URL || 'https://auth.youthacks.org';
    const authUrl = process.env.YOUTHACKS_AUTH_URL || `${base.replace(/\/$/, '')}/oauth/authorize`;
    const clientId = process.env.YOUTHACKS_CLIENT_ID;
    const callback =
      process.env.YOUTHACKS_CALLBACK_URL ||
      `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/youthacks/callback`;
    const scope = encodeURIComponent('profile email');

    // Generate CSRF state and set as HttpOnly cookie for callback validation.
    const crypto = require('crypto');
    const state = crypto.randomBytes(16).toString('hex');

    const cookieOptions: any = {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
      sameSite: 'lax',
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('oauth_state', state, cookieOptions);

    return `${authUrl}?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(callback)}&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('email') email: string, @Query('token') token: string) {
    return this.authService.verifyEmail(email, token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendDto.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto.email, resetDto.token, resetDto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('youthacks')
  redirectToYouthacks(@Res() res: Response) {
    return res.redirect(this.buildYouthacksAuthorizationUrl(res));
  }

  @Get('youthacks-url')
  getYouthacksAuthorizationUrl(@Res() res: Response) {
    return res.json({ redirectUrl: this.buildYouthacksAuthorizationUrl(res) });
  }

  @Get('youthacks/callback')
  async YouthacksCallback(@Req() req, @Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const base = process.env.YOUTHACKS_BASE_URL || 'https://auth.youthacks.org';
    const tokenUrl = process.env.YOUTHACKS_TOKEN_URL || `${base.replace(/\/$/, '')}/oauth/token`;
    const clientId = process.env.YOUTHACKS_CLIENT_ID;
    const clientSecret = process.env.YOUTHACKS_CLIENT_SECRET;
    const callback = process.env.YOUTHACKS_CALLBACK_URL || `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/youthacks/callback`;
    const userinfoUrl = process.env.YOUTHACKS_USERINFO_URL || `${base.replace(/\/$/, '')}/oauth/userinfo`;

    // Validate state against cookie
    const cookieHeader = req.headers && req.headers.cookie;
    const parseCookie = (cookieStr: string | undefined, name: string) => {
      if (!cookieStr) return null;
      const parts = cookieStr.split(';').map((c: string) => c.trim());
      const found = parts.find((p: string) => p.startsWith(name + '='));
      if (!found) return null;
      return decodeURIComponent(found.split('=').slice(1).join('='));
    };
    const cookieState = parseCookie(cookieHeader, 'oauth_state');
    if (!state || !cookieState || state !== cookieState) {
      return res.status(400).json({ message: 'Invalid or missing OAuth state' });
    }

    // Clear the state cookie
    res.clearCookie('oauth_state');

    try {
      const tokenResp = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callback,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const accessToken = tokenResp.data.access_token;

      const userResp = await axios.get(userinfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const profile = userResp.data;

      const loginResult = await this.authService.validateOAuthLogin('youthacks', accessToken, profile);

      // Redirect back to frontend with token and user info in fragment so the client can store it.
      const frontend = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
      const fragment = `#access_token=${encodeURIComponent(loginResult.access_token)}&user=${encodeURIComponent(
        JSON.stringify(loginResult.user),
      )}`;

      return res.redirect(`${frontend.replace(/\/$/, '')}/oauth/callback${fragment}`);
    } catch (err: any) {
      return res.status(500).json({ message: 'OAuth exchange failed', details: err.message });
    }
  }
}
