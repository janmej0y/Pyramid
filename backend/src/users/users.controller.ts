import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.types';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /users — backs the members picker. */
  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  /** PATCH /users/me — the editable fields on the settings profile screen. */
  @Patch('me')
  updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.users.update(user.id, dto);
  }
}
