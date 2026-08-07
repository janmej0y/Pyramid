import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GuestLoginDto } from './dto/guest-login.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './jwt.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /auth/guest — backs the "Continue as Guest" button. */
  @Public()
  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  guestLogin(@Body() dto: GuestLoginDto) {
    return this.auth.loginAsGuest(dto.name);
  }

  /** GET /auth/me — resolves the session token to a user. */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.getProfile(user.id);
  }
}
