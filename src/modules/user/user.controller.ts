import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { Request } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async getCurrentUser(@Request() req) {
    const user = req.user;
    return this.service.getCurrentUser(user.id, user.serverRole);
  }
}
