import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { prisma } from '@chat/db';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Contact your admin.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d'
      }
    );

    return { accessToken, refreshToken, user: this.toPublicUser(user) };
  }

  async registerAgent(data: { name: string; email: string; password: string }) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Name is required');
    }
    if (!data.email?.trim()) {
      throw new BadRequestException('Email is required');
    }
    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'agent',
        isActive: true
      }
    });

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d'
      }
    );

    return { accessToken, refreshToken, user: this.toPublicUser(user) };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret()
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    return { accessToken };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; aiSystemPrompt?: string; pushToken?: string }
  ) {
    const normalizedEmail = data.email?.trim().toLowerCase();

    if (normalizedEmail) {
      const existing = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId }
        }
      });
      if (existing) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(normalizedEmail !== undefined && { email: normalizedEmail }),
        ...(data.aiSystemPrompt !== undefined && { aiSystemPrompt: data.aiSystemPrompt }),
        ...(data.pushToken !== undefined && { pushToken: data.pushToken })
      }
    });
    return this.toPublicUser(updated);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  private getRefreshSecret(): string {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (process.env.NODE_ENV === 'production') {
      if (!secret || secret.length < 32) {
        throw new Error(
          'JWT_REFRESH_SECRET must be set to a strong random secret (min 32 chars) in production.\n' +
            'Generate one with: openssl rand -base64 48'
        );
      }
    }
    return secret || 'dev-refresh-secret-local-only';
  }

  /**
   * Login or create user from Google OAuth
   */
  async loginOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    picture?: string | null;
  }) {
    // Check if user exists by email
    let user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });

    if (user) {
      // Update Google ID if not set (linking existing account)
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId }
        });
      }
    } else {
      // Create new user from Google
      user = await prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name,
          googleId: profile.googleId,
          passwordHash: '', // No password for OAuth users
          role: 'agent',
          isActive: true
        }
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Contact your admin.');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d'
      }
    );

    return { accessToken, refreshToken, user: this.toPublicUser(user) };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    aiSystemPrompt: string | null;
    pushToken: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      aiSystemPrompt: user.aiSystemPrompt,
      pushToken: user.pushToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
