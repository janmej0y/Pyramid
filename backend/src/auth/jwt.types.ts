import type { Request } from 'express';

/** Claims carried by a session token. */
export interface JwtPayload {
  /** User id. */
  sub: string;
  name: string;
  isGuest: boolean;
}

/** The authenticated user attached to a request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  name: string;
  isGuest: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
