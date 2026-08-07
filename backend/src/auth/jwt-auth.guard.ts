import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedRequest, JwtPayload } from './jwt.types';

/**
 * Verifies the bearer token and attaches the caller to the request.
 *
 * Registered globally in AppModule, so every route is protected unless it opts
 * out with @Public() — endpoints are secure by default rather than by memory.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      (request as AuthenticatedRequest).user = {
        id: payload.sub,
        name: payload.name,
        isGuest: payload.isGuest,
      };
      return true;
    } catch {
      // Covers expired, malformed and wrongly-signed tokens alike; the client
      // only needs to know the session is unusable.
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : undefined;
  }
}
