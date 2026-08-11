import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
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
    @InjectModel(User.name) private readonly userModel: Model<User>,
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
    const user = await this.userModel.create({
      name: name?.trim() || 'Guest',
      isGuest: true,
      avatar: GUEST_AVATAR,
    });

    const id = user._id.toString();

    return {
      accessToken: await this.signToken(id, user.name, user.isGuest),
      user: {
        id,
        name: user.name,
        isGuest: user.isGuest,
        avatar: user.avatar ?? null,
      },
    };
  }

  /** Resolves the current user from a token subject, for GET /auth/me. */
  async getProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Session no longer valid');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      // The token is well-formed but its subject is gone (e.g. a pruned guest).
      throw new UnauthorizedException('Session no longer valid');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email ?? null,
      title: user.title ?? null,
      username: user.username ?? null,
      avatar: user.avatar ?? null,
      isGuest: user.isGuest,
      createdAt: (user as unknown as { createdAt: Date }).createdAt,
    };
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
