import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthUser } from './jwt.types';

/**
 * Injects the user attached by JwtAuthGuard, so controllers read
 * `@CurrentUser() user: AuthUser` instead of reaching into the request.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return data ? request.user?.[data] : request.user;
  },
);
