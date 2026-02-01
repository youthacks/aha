import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const adminKey = this.configService.get<string>('ADMIN_API_KEY');
    if (!adminKey) {
      throw new ForbiddenException('Admin key not configured');
    }

    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-admin-key'] as string | undefined;

    if (!providedKey || providedKey !== adminKey) {
      throw new ForbiddenException('Invalid admin key');
    }

    return true;
  }
}
