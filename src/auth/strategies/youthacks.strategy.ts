import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class YouthacksStrategy extends PassportStrategy(Strategy, 'youthacks') {
  constructor(private configService: ConfigService, private authService: AuthService) {
    const base = configService.get<string>('YOUTHACKS_BASE_URL') || 'https://auth.youthacks.org';
    const authorizationURL = `${base.replace(/\/$/, '')}/oauth/authorize`;
    const tokenURL = `${base.replace(/\/$/, '')}/oauth/token`;
    const userinfoURL = `${base.replace(/\/$/, '')}/oauth/userinfo`;

    super({
      authorizationURL,
      tokenURL,
      clientID: configService.get<string>('YOUTHACKS_CLIENT_ID'),
      clientSecret: configService.get<string>('YOUTHACKS_CLIENT_SECRET'),
      callbackURL:
        configService.get<string>('YOUTHACKS_CALLBACK_URL') ||
        `${(configService.get<string>('BACKEND_URL') || configService.get<string>('API_URL') || configService.get<string>('APP_URL') || 'http://localhost:3000').replace(/\/$/, '')}/auth/youthacks/callback`,
      scope: ['openid', 'profile', 'email'],
    });
    // keep userinfo url available on the instance if needed elsewhere
    (this as any).userinfoURL = userinfoURL;
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      const user = await this.authService.validateOAuthLogin('youthacks', accessToken, profile);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
