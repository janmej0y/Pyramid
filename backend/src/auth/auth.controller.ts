import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { Post } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GuestLoginDto } from './dto/guest-login.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './jwt.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleOAuthService,
    private readonly config: ConfigService,
  ) {}

  /** POST /auth/guest — backs the "Continue as Guest" button. */
  @Public()
  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  guestLogin(@Body() dto: GuestLoginDto) {
    return this.auth.loginAsGuest(dto.name);
  }

  /**
   * GET /auth/providers — lets the UI show only the sign-in methods this
   * deployment actually supports, rather than a button that fails on click.
   */
  @Public()
  @Get('providers')
  providers() {
    return { guest: true, google: this.google.isEnabled };
  }

  /**
   * GET /auth/google — sends the browser to Google's consent screen.
   *
   * The CSRF state is round-tripped in a short-lived, HTTP-only cookie so the
   * callback can confirm the response belongs to a flow this server started.
   */
  @Public()
  @Get('google')
  startGoogle(@Res() res: Response) {
    const { url, state } = this.google.buildAuthUrl();

    res.cookie('pyramid_oauth_state', state, {
      httpOnly: true,
      // The callback is a top-level redirect from Google, so the cookie must
      // survive a cross-site navigation; `lax` allows that for GET.
      sameSite: 'lax',
      secure: this.isProduction,
      maxAge: 10 * 60 * 1000,
      path: '/api/auth',
    });

    res.redirect(url);
  }

  /**
   * GET /auth/google/callback — Google redirects here with a one-time code.
   *
   * Ends by redirecting the browser back to the frontend with the session
   * token in the URL fragment. A fragment rather than a query string: it is
   * never sent to a server, so the token stays out of access logs and
   * Referer headers.
   */
  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const target = this.successRedirect;

    res.clearCookie('pyramid_oauth_state', { path: '/api/auth' });

    // The user dismissed the consent screen — not an error worth a stack trace.
    if (error || !code) {
      return res.redirect(
        `${target}#error=${encodeURIComponent(error ?? 'cancelled')}`,
      );
    }

    const cookieState = (res.req.cookies as Record<string, string> | undefined)
      ?.pyramid_oauth_state;

    if (!state || state !== cookieState || !this.google.verifyState(state)) {
      return res.redirect(`${target}#error=invalid_state`);
    }

    try {
      const profile = await this.google.exchangeCode(code);
      const { accessToken } = await this.auth.loginWithGoogle(profile);
      return res.redirect(`${target}#token=${encodeURIComponent(accessToken)}`);
    } catch {
      // exchangeCode already logged the actionable detail server-side.
      return res.redirect(`${target}#error=signin_failed`);
    }
  }

  /** GET /auth/me — resolves the session token to a user. */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.getProfile(user.id);
  }

  private get isProduction(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Where to send the browser once sign-in resolves. Defaults to the first
   * allowed CORS origin, which is the frontend in every deployment.
   */
  private get successRedirect(): string {
    const explicit = this.config.get<string>('OAUTH_SUCCESS_REDIRECT');
    if (explicit) return explicit.replace(/\/$/, '');

    const origin = this.config
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    return `${origin}/auth/callback`;
  }
}
