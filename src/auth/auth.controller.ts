import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Res,
  Req,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  private getOAuthCookieOptions(): any {
    const cookieOptions: any = {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
      sameSite: 'lax',
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }
    return cookieOptions;
  }

  private resolveAuthenticatedUserId(req: any): string | null {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return null;
    }

    try {
      const payload: any = this.jwtService.verify(token);
      return payload?.sub || null;
    } catch {
      return null;
    }
  }

  private parseCookie(cookieStr: string | undefined, name: string): string | null {
    if (!cookieStr) return null;
    const parts = cookieStr.split(';').map((c: string) => c.trim());
    const found = parts.find((p: string) => p.startsWith(name + '='));
    if (!found) return null;
    return decodeURIComponent(found.split('=').slice(1).join('='));
  }

  private getBackendBaseUrl(): string {
    return (
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.APP_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private getFrontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  private isDevOAuthDebugMode(): boolean {
    return (process.env.NODE_ENV || 'development').toLowerCase() !== 'production';
  }

  private maskValue(value?: string | null, visibleChars = 4): string {
    if (!value) return 'missing';
    if (value.length <= visibleChars * 2) return '*'.repeat(value.length);
    return `${value.slice(0, visibleChars)}***${value.slice(-visibleChars)}`;
  }

  private logOAuthDebug(label: string, details: Record<string, any>) {
    if (!this.isDevOAuthDebugMode()) return;
    console.log(`\\n[OAuth Debug] ${label}`);
    console.log(JSON.stringify(details, null, 2));
  }

  private quoteForSingleQuotedShell(value: string): string {
    return value.replace(/'/g, `'"'"'`);
  }

  private buildTokenCurlCommand(
    tokenUrl: string,
    grantBase: { grant_type: string; code: string; redirect_uri: string },
    clientId: string,
    clientSecret: string,
    mode: 'basic' | 'body',
  ): string {
    const dataParts = [
      `--data-urlencode 'grant_type=${this.quoteForSingleQuotedShell(grantBase.grant_type)}'`,
      `--data-urlencode 'code=${this.quoteForSingleQuotedShell(grantBase.code)}'`,
      `--data-urlencode 'redirect_uri=${this.quoteForSingleQuotedShell(grantBase.redirect_uri)}'`,
      ...(mode === 'body'
        ? [
            `--data-urlencode 'client_id=${this.quoteForSingleQuotedShell(clientId)}'`,
            `--data-urlencode 'client_secret=${this.quoteForSingleQuotedShell(clientSecret)}'`,
          ]
        : []),
    ];

    const authPart = mode === 'basic'
      ? `-u '${this.quoteForSingleQuotedShell(clientId)}:${this.quoteForSingleQuotedShell(clientSecret)}'`
      : '';

    return [
      `curl -i -X POST '${this.quoteForSingleQuotedShell(tokenUrl)}'`,
      `  -H 'Content-Type: application/x-www-form-urlencoded'`,
      `  -H 'Accept: application/json'`,
      authPart ? `  ${authPart}` : '',
      ...dataParts.map((part) => `  ${part}`),
    ]
      .filter(Boolean)
      .join(' \\\n');
  }

  private getYouthacksCallbackUrl(mode: 'login' | 'link'): string {
    if (mode === 'link') {
      return (
        process.env.YOUTHACKS_LINK_CALLBACK_URL ||
        `${this.getFrontendBaseUrl()}/auth/youthacks/integration/callback`
      );
    }

    return process.env.YOUTHACKS_CALLBACK_URL || `${this.getFrontendBaseUrl()}/auth/youthacks/callback`;
  }

  private async resolveOidcConfig() {
    const base = (process.env.YOUTHACKS_BASE_URL || 'https://auth.youthacks.org').replace(/\/$/, '');
    const configuredAuthUrl = process.env.YOUTHACKS_AUTH_URL;
    const configuredTokenUrl = process.env.YOUTHACKS_TOKEN_URL;
    const configuredUserInfoUrl = process.env.YOUTHACKS_USERINFO_URL;

    if (configuredAuthUrl && configuredTokenUrl && configuredUserInfoUrl) {
      return {
        authorizationEndpoint: configuredAuthUrl,
        tokenEndpoint: configuredTokenUrl,
        userinfoEndpoint: configuredUserInfoUrl,
      };
    }

    try {
      const discoveryUrl = `${base}/.well-known/openid-configuration`;
      const discovery = await axios.get(discoveryUrl, { timeout: 5000 });
      return {
        authorizationEndpoint: configuredAuthUrl || discovery.data.authorization_endpoint || `${base}/oauth/authorize`,
        tokenEndpoint: configuredTokenUrl || discovery.data.token_endpoint || `${base}/oauth/token`,
        userinfoEndpoint: configuredUserInfoUrl || discovery.data.userinfo_endpoint || `${base}/oauth/userinfo`,
      };
    } catch {
      return {
        authorizationEndpoint: configuredAuthUrl || `${base}/oauth/authorize`,
        tokenEndpoint: configuredTokenUrl || `${base}/oauth/token`,
        userinfoEndpoint: configuredUserInfoUrl || `${base}/oauth/userinfo`,
      };
    }
  }

  private async buildYouthacksAuthorizationUrl(res: Response, mode: 'login' | 'link'): Promise<string> {
    const oidc = await this.resolveOidcConfig();
    const authUrl = oidc.authorizationEndpoint;
    const clientId = process.env.YOUTHACKS_CLIENT_ID;
    const callback = this.getYouthacksCallbackUrl(mode);
    const scope = encodeURIComponent('openid profile email');

    // Generate CSRF state and set as HttpOnly cookie for callback validation.
    const crypto = require('crypto');
    const state = crypto.randomBytes(16).toString('hex');

    const cookieOptions = this.getOAuthCookieOptions();

    res.cookie('oauth_state', state, cookieOptions);
    res.cookie('oauth_mode', mode, cookieOptions);

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
  async redirectToYouthacks(@Req() req, @Res() res: Response) {
    const loggedInUserId = this.resolveAuthenticatedUserId(req);
    if (loggedInUserId) {
      res.cookie('oauth_link_user_id', loggedInUserId, this.getOAuthCookieOptions());
      return res.redirect(await this.buildYouthacksAuthorizationUrl(res, 'link'));
    }

    return res.redirect(await this.buildYouthacksAuthorizationUrl(res, 'login'));
  }

  @Get('youthacks-url')
  async getYouthacksAuthorizationUrl(@Req() req, @Res() res: Response) {
    const loggedInUserId = this.resolveAuthenticatedUserId(req);
    if (loggedInUserId) {
      res.cookie('oauth_link_user_id', loggedInUserId, this.getOAuthCookieOptions());
      return res.json({ redirectUrl: await this.buildYouthacksAuthorizationUrl(res, 'link') });
    }

    return res.json({ redirectUrl: await this.buildYouthacksAuthorizationUrl(res, 'login') });
  }

  @UseGuards(JwtAuthGuard)
  @Get('youthacks-link-url')
  async getYouthacksLinkAuthorizationUrl(@Request() req, @Res() res: Response) {
    res.cookie('oauth_link_user_id', req.user.id, this.getOAuthCookieOptions());
    return res.json({ redirectUrl: await this.buildYouthacksAuthorizationUrl(res, 'link') });
  }

  private async exchangeYouthacksAuthorizationCode(
    req: any,
    res: Response,
    code: string,
    state: string,
    expectedMode?: 'login' | 'link',
  ) {
    const oidc = await this.resolveOidcConfig();
    const tokenUrl = oidc.tokenEndpoint;
    const clientId = process.env.YOUTHACKS_CLIENT_ID;
    const clientSecret = process.env.YOUTHACKS_CLIENT_SECRET;
    const userinfoUrl = oidc.userinfoEndpoint;

    const cookieHeader = req.headers && req.headers.cookie;
    const cookieState = this.parseCookie(cookieHeader, 'oauth_state');
    const oauthMode = this.parseCookie(cookieHeader, 'oauth_mode') as 'login' | 'link' | null;
    const linkUserId = this.parseCookie(cookieHeader, 'oauth_link_user_id');
    const activeMode = expectedMode || oauthMode || 'login';
    const callback = this.getYouthacksCallbackUrl(activeMode);

    if (!state || !cookieState || state !== cookieState) {
      throw new BadRequestException('Invalid or missing OAuth state');
    }

    res.clearCookie('oauth_state');
    res.clearCookie('oauth_mode');
    res.clearCookie('oauth_link_user_id');

    try {
      const grantBase = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: callback,
      };

      // Some providers require HTTP Basic client auth, while others accept body credentials.
      let tokenResp;
      try {
        this.logOAuthDebug('Token request (basic client auth)', {
          mode: activeMode,
          tokenUrl,
          callback,
          clientId: this.maskValue(clientId),
          grantType: grantBase.grant_type,
          hasCode: !!grantBase.code,
          curl: this.buildTokenCurlCommand(tokenUrl, grantBase, clientId, clientSecret, 'basic'),
        });

        tokenResp = await axios.post(
          tokenUrl,
          new URLSearchParams(grantBase).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
          },
        );

        this.logOAuthDebug('Token response (basic client auth)', {
          status: tokenResp.status,
          hasAccessToken: !!tokenResp?.data?.access_token,
          responseKeys: Object.keys(tokenResp?.data || {}),
          data: tokenResp?.data,
        });
      } catch (basicErr: any) {
        this.logOAuthDebug('Token response error (basic client auth)', {
          status: basicErr?.response?.status,
          data: basicErr?.response?.data,
          message: basicErr?.message,
        });

        const basicStatus = basicErr?.response?.status;
        if (basicStatus !== 401 && basicStatus !== 403) {
          throw basicErr;
        }

        this.logOAuthDebug('Token request (body client auth fallback)', {
          mode: activeMode,
          tokenUrl,
          callback,
          clientId: this.maskValue(clientId),
          clientSecret: this.maskValue(clientSecret),
          grantType: grantBase.grant_type,
          hasCode: !!grantBase.code,
          curl: this.buildTokenCurlCommand(tokenUrl, grantBase, clientId, clientSecret, 'body'),
        });

        tokenResp = await axios.post(
          tokenUrl,
          new URLSearchParams({
            ...grantBase,
            client_id: clientId,
            client_secret: clientSecret,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
          },
        );

        this.logOAuthDebug('Token response (body client auth fallback)', {
          status: tokenResp.status,
          hasAccessToken: !!tokenResp?.data?.access_token,
          responseKeys: Object.keys(tokenResp?.data || {}),
          data: tokenResp?.data,
        });
      }

      const accessToken = tokenResp.data.access_token;

      this.logOAuthDebug('Userinfo request', {
        userinfoUrl,
        accessToken: this.maskValue(accessToken),
      });

      const userResp = await axios.get(userinfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      this.logOAuthDebug('Userinfo response', {
        status: userResp.status,
        data: userResp.data,
      });

      const profile = userResp.data;

      if (activeMode === 'link') {
        if (!linkUserId) {
          throw new UnauthorizedException('Missing account link context');
        }

        const providerId = profile.sub || profile.id;
        if (!providerId) {
          throw new BadRequestException('OAuth profile is missing provider subject');
        }

        await this.authService.linkYouthacksAccount(linkUserId, providerId);
        return {
          mode: 'link' as const,
          message: 'Youthacks account linked successfully',
        };
      }

      const loginResult = await this.authService.validateOAuthLogin('youthacks', accessToken, profile);
      return {
        mode: 'login' as const,
        ...loginResult,
      };
    } catch (err: any) {
      if (err?.getStatus && typeof err.getStatus === 'function') {
        throw err;
      }

      const providerStatus = err?.response?.status;
      const providerData = err?.response?.data;
      const providerError = providerData?.error || providerData?.code;
      const providerDesc = providerData?.error_description || providerData?.message || providerData?.detail;

      if (providerStatus === 403) {
        const baseHelp = activeMode === 'link'
          ? 'Youthacks denied the account-link request. Please reconnect from Settings and try again.'
          : 'Youthacks denied the login request. If this is your first OAuth login, connect your Youthacks account in Settings first.';

        const redirectHelp = `Confirm this redirect URI is registered in your OAuth provider: ${callback}`;
        const providerHelp = providerDesc ? ` Provider response: ${providerDesc}` : '';

        throw new ForbiddenException(`${baseHelp} ${redirectHelp}.${providerHelp}`.trim());
      }

      if (providerStatus === 400 && providerError === 'invalid_grant') {
        throw new BadRequestException(
          'OAuth code is invalid or expired. Please retry login from the beginning and do not reuse old callback URLs.',
        );
      }

      if (err?.response?.data?.error) {
        const detail = providerDesc ? `${providerError}: ${providerDesc}` : providerError;
        throw new InternalServerErrorException(`OAuth exchange failed: ${detail}`);
      }
      if (err?.response?.data?.error_description) {
        throw new InternalServerErrorException(`OAuth exchange failed: ${err.response.data.error_description}`);
      }
      if (err?.message) {
        throw new InternalServerErrorException(`OAuth exchange failed: ${err.message}`);
      }
      throw new InternalServerErrorException('OAuth exchange failed');
    }
  }

  @Get('youthacks/exchange')
  async exchangeYouthacksCode(@Req() req, @Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const cookieMode = (this.parseCookie(req?.headers?.cookie, 'oauth_mode') as 'login' | 'link' | null) || 'login';

    try {
      const result = await this.exchangeYouthacksAuthorizationCode(req, res, code, state, cookieMode);
      return res.json(result);
    } catch (err: any) {
      const status = err?.getStatus ? err.getStatus() : err?.status || 500;
      const message = err?.response?.message || err?.message || 'OAuth exchange failed';
      return res.status(status).json({
        message,
        statusCode: status,
        oauthMode: cookieMode,
      });
    }
  }

  private buildOAuthErrorRedirect(mode: 'login' | 'link', status: number, message: string): string {
    const frontend = this.getFrontendBaseUrl();
    const target = mode === 'link' ? '/settings' : '/login';
    const query = `oauth=failed&status=${encodeURIComponent(String(status))}&reason=${encodeURIComponent(message)}`;
    return `${frontend}${target}?${query}`;
  }

  private async handleYouthacksCallback(
    req: any,
    code: string,
    state: string,
    res: Response,
    mode: 'login' | 'link',
  ) {
    try {
      const result = await this.exchangeYouthacksAuthorizationCode(req, res, code, state, mode);
      if (result.mode === 'link') {
        return res.redirect(`${this.getFrontendBaseUrl()}/settings?oauth=linked`);
      }

      const fragment = `#access_token=${encodeURIComponent(result.access_token)}&user=${encodeURIComponent(
        JSON.stringify(result.user),
      )}`;

      return res.redirect(`${this.getFrontendBaseUrl()}/oauth/callback${fragment}`);
    } catch (err: any) {
      const status = err?.getStatus ? err.getStatus() : err?.status || 500;
      const message = err?.response?.message || err?.message || 'OAuth exchange failed';
      return res.redirect(this.buildOAuthErrorRedirect(mode, status, message));
    }
  }

  @Get('youthacks/callback')
  async YouthacksCallback(@Req() req, @Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    return this.handleYouthacksCallback(req, code, state, res, 'login');
  }

  @Get('youthacks/integration/callback')
  async youthacksIntegrationCallback(
    @Req() req,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    return this.handleYouthacksCallback(req, code, state, res, 'link');
  }
}
