import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL') || 
      `${config.get<string>('NEXT_PUBLIC_BACKEND_URL') || 'http://localhost:3001'}/auth/google/callback`;

    if (!clientID || !clientSecret) {
      // In development, allow startup but Google auth won't work
      if (process.env.NODE_ENV === 'production') {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for Google OAuth');
      }
    }

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    if (!emails || emails.length === 0) {
      return done(new UnauthorizedException('Google account must have an email'), undefined);
    }

    const user = {
      googleId: id,
      email: emails[0].value,
      name: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : emails[0].value.split('@')[0],
      picture: photos?.[0]?.value || null,
    };

    done(null, user);
  }
}
