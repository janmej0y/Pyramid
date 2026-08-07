import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser, JwtPayload } from './jwt.types';

/** Inline gradient avatar so guest sessions match the design's user chip. */
const GUEST_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<defs><radialGradient id="bg" cx="30%" cy="25%" r="95%">' +
      '<stop offset="0%" stop-color="#c084fc"/>' +
      '<stop offset="40%" stop-color="#7c3aed"/>' +
      '<stop offset="100%" stop-color="#1e1b4b"/>' +
      '</radialGradient></defs>' +
      '<rect width="64" height="64" fill="url(#bg)"/>' +
      '<ellipse cx="21" cy="20" rx="17" ry="15" fill="#fbcfe8" opacity=".45"/>' +
      '<ellipse cx="45" cy="46" rx="19" ry="16" fill="#22d3ee" opacity=".35"/>' +
      '</svg>',
  );

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Creates a throwaway guest account and returns a signed session token.
   * Each call produces a distinct user so two guests never share a board.
   */
  async loginAsGuest(name?: string): Promise<{
    accessToken: string;
    user: AuthUser & { avatar: string | null };
  }> {
    const user = await this.prisma.user.create({
      data: {
        name: name?.trim() || 'Guest',
        isGuest: true,
        avatar: GUEST_AVATAR,
      },
    });

    return {
      accessToken: await this.signToken(user.id, user.name, user.isGuest),
      user: {
        id: user.id,
        name: user.name,
        isGuest: user.isGuest,
        avatar: user.avatar,
      },
    };
  }

  /** Resolves the current user from a token subject, for GET /auth/me. */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        username: true,
        avatar: true,
        isGuest: true,
        createdAt: true,
      },
    });

    if (!user) {
      // The token is well-formed but its subject is gone (e.g. a pruned guest).
      throw new UnauthorizedException('Session no longer valid');
    }

    return user;
  }

  private signToken(
    sub: string,
    name: string,
    isGuest: boolean,
  ): Promise<string> {
    const payload: JwtPayload = { sub, name, isGuest };
    return this.jwt.signAsync(payload);
  }
}
