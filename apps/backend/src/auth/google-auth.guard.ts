import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private config: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if Google OAuth is configured
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId || clientId === 'not-configured') {
      const response = context.switchToHttp().getResponse();
      response.redirect('/login?error=google_not_configured');
      return false;
    }
    return super.canActivate(context);
  }

  handleRequest(err: Error | null, user: any) {
    if (err || !user) {
      throw err || new Error('Google authentication failed');
    }
    return user;
  }
}
