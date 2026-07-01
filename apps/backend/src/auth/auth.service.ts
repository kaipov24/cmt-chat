import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Profile, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './types/authenticated-user';
import type { AccessTokenPayload, RefreshTokenPayload } from './types/jwt-payload';

export type AuthUserResponse = Pick<User, 'email' | 'id' | 'role' | 'status'> & {
  profile: Pick<Profile, 'displayName' | 'username'> | null;
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUserResponse;
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { profile: { is: { username } } }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email or username is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            city: dto.city?.trim() || null,
            country: dto.country?.trim() || null,
            displayName: dto.displayName.trim(),
            locationVisibility: 'city',
            showOnlineStatus: true,
            username,
          },
        },
      },
      select: this.authUserSelect,
    });

    return {
      tokens: await this.issueTokens(user),
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: {
        ...this.authUserSelect,
        passwordHash: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      data: { lastSeenAt: new Date() },
      where: { id: user.id },
    });

    const authUser: AuthUserResponse = {
      email: user.email,
      id: user.id,
      profile: user.profile,
      role: user.role,
      status: user.status,
    };

    return {
      tokens: await this.issueTokens(authUser),
      user: authUser,
    };
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: {
        user: {
          select: this.authUserSelect,
        },
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.userId !== payload.sub ||
      storedToken.user.status !== 'active'
    ) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokenMatches = await argon2.verify(storedToken.tokenHash, refreshToken);

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    await this.prisma.refreshToken.update({
      data: { revokedAt: new Date() },
      where: { id: storedToken.id },
    });

    return {
      tokens: await this.issueTokens(storedToken.user),
      user: storedToken.user,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.prisma.refreshToken.updateMany({
        data: { revokedAt: new Date() },
        where: {
          id: payload.tokenId,
          revokedAt: null,
          userId: payload.sub,
        },
      });
    } catch {
      return;
    }
  }

  async getCurrentUser(user: AuthenticatedUser): Promise<AuthUserResponse> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: this.authUserSelect,
    });

    if (!currentUser || currentUser.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    return currentUser;
  }

  private async issueTokens(user: AuthUserResponse): Promise<AuthTokens> {
    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        tokenHash: 'pending',
        userId: user.id,
      },
      select: { id: true },
    });

    const accessPayload: AccessTokenPayload = {
      email: user.email,
      role: user.role,
      sub: user.id,
      type: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId: refreshTokenRecord.id,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        expiresIn: ACCESS_TOKEN_TTL,
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
      this.jwt.signAsync(refreshPayload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      }),
    ]);

    await this.prisma.refreshToken.update({
      data: { tokenHash: await argon2.hash(refreshToken) },
      where: { id: refreshTokenRecord.id },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  private readonly authUserSelect = {
    email: true,
    id: true,
    profile: {
      select: {
        displayName: true,
        username: true,
      },
    },
    role: true,
    status: true,
  } as const;
}
