import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService, type AuthSession } from './auth.service';
import type { AuthenticatedUser } from './types/authenticated-user';

interface PublicAuthSession {
  accessToken: string;
  user: AuthSession['user'];
}

type CookieRequest = Request & {
  cookies?: unknown;
};

const accessCookieMaxAgeMs = 15 * 60 * 1000;
const refreshCookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.register(dto);
    this.setAuthCookies(response, session);

    return this.toPublicSession(session);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto);
    this.setAuthCookies(response, session);

    return this.toPublicSession(session);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Req() request: CookieRequest, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.refresh(this.getCookie(request, 'refreshToken'));
    this.setAuthCookies(response, session);

    return this.toPublicSession(session);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: CookieRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(this.getCookie(request, 'refreshToken'));
    this.clearAuthCookies(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getCurrentUser(user);
  }

  private setAuthCookies(response: Response, session: AuthSession) {
    const secure = process.env.NODE_ENV === 'production';

    response.cookie('accessToken', session.tokens.accessToken, {
      httpOnly: true,
      maxAge: accessCookieMaxAgeMs,
      path: '/',
      sameSite: 'lax',
      secure,
    });
    response.cookie('refreshToken', session.tokens.refreshToken, {
      httpOnly: true,
      maxAge: refreshCookieMaxAgeMs,
      path: '/',
      sameSite: 'lax',
      secure,
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('refreshToken', { path: '/' });
  }

  private toPublicSession(session: AuthSession): PublicAuthSession {
    return {
      accessToken: session.tokens.accessToken,
      user: session.user,
    };
  }

  private getCookie(request: CookieRequest, name: string): string | undefined {
    if (!request.cookies || typeof request.cookies !== 'object') {
      return undefined;
    }

    const cookies = request.cookies as Record<string, unknown>;
    const value = cookies[name];

    return typeof value === 'string' ? value : undefined;
  }
}
