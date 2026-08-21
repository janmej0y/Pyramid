import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

export type GoogleProfile = {
  googleId: string;
  email: string | null;
  name: string;
  avatar: string | null;
};

/**
 * Google sign-in via the OAuth 2.0 authorization-code flow, called directly
 * rather than through Passport.
 *
 * The app already hand-rolls its JWT guard, so adding passport +
 * passport-google-oauth20 + @nestjs/passport would introduce a second, parallel
 * auth abstraction for one provider. The flow itself is two HTTP calls.
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  /** False when the deployment has no Google credentials configured. */
  get isEnabled(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
      this.config.get<string>('GOOGLE_CLIENT_SECRET') &&
      this.config.get<string>('GOOGLE_CALLBACK_URL'),
    );
  }

  /**
   * Builds the consent-screen URL plus the CSRF state to round-trip with it.
   *
   * `state` is an HMAC over a random nonce, keyed with JWT_SECRET. Signing it
   * means the callback can verify the value came from us without any
   * server-side session store — which matters on a platform that may run
   * several instances or restart between the two legs of the flow.
   */
  buildAuthUrl(): { url: string; state: string } {
    this.assertEnabled();

    const nonce = randomBytes(16).toString('hex');
    const state = `${nonce}.${this.signState(nonce)}`;

    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      // Always show the picker: without this, a browser already signed in to
      // exactly one Google account skips the screen entirely, which reads as a
      // broken button when someone wants to choose a different account.
      prompt: 'select_account',
    });

    return { url: `${AUTH_ENDPOINT}?${params.toString()}`, state };
  }

  /** Constant-time check that `state` was issued by this server. */
  verifyState(state: string | undefined): boolean {
    if (!state) return false;

    const [nonce, signature] = state.split('.');
    if (!nonce || !signature) return false;

    const expected = this.signState(nonce);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    // timingSafeEqual throws on length mismatch, so compare lengths first.
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /**
   * Exchanges the one-time code for tokens, then reads the profile.
   *
   * Google's error bodies carry the actionable detail (redirect_uri_mismatch,
   * invalid_client), so they are logged server-side; the caller only learns
   * that sign-in failed.
   */
  async exchangeCode(code: string): Promise<GoogleProfile> {
    this.assertEnabled();

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      this.logger.error(
        `Google token exchange failed (${tokenResponse.status}): ${detail}`,
      );
      throw new UnauthorizedException('Google sign-in failed');
    }

    const { access_token: accessToken } = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!accessToken) {
      this.logger.error('Google token response contained no access_token');
      throw new UnauthorizedException('Google sign-in failed');
    }

    const profileResponse = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      this.logger.error(
        `Google userinfo request failed (${profileResponse.status})`,
      );
      throw new UnauthorizedException('Google sign-in failed');
    }

    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      given_name?: string;
      picture?: string;
    };

    if (!profile.sub) {
      this.logger.error('Google userinfo response contained no subject');
      throw new UnauthorizedException('Google sign-in failed');
    }

    return {
      googleId: profile.sub,
      // An unverified address must not be trusted for account matching — it
      // would let someone claim an account by signing up with its email.
      email: profile.email_verified ? (profile.email ?? null) : null,
      name: profile.name || profile.given_name || 'User',
      avatar: profile.picture ?? null,
    };
  }

  private signState(nonce: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_SECRET'))
      .update(nonce)
      .digest('hex');
  }

  private assertEnabled(): void {
    if (!this.isEnabled) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured on this server',
      );
    }
  }
}
