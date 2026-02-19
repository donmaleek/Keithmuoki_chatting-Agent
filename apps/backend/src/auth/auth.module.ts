import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (process.env.NODE_ENV === 'production') {
          if (!secret || secret.length < 32 || secret.includes('change-me')) {
            throw new Error(
              'JWT_SECRET must be set to a strong random secret (min 32 chars) in production.\n' +
                'Generate one with: openssl rand -base64 48'
            );
          }
        }
        return {
          secret: secret || 'dev-secret-local-only',
          signOptions: { expiresIn: '15m' }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  // Export JwtModule so MessagesModule can inject JwtService into the gateway
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
