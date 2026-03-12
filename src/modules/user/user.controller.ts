import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { Request } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { NewPasswordDto } from './dto/new-password.dto.js';

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

  @Post('tenant/forgot-password')
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.service.forgotTenantUserPassword(body.email);
  }

  @Post('tenant/verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    return this.service.verifyEmailToken(data);
  }

  @Post('tenant/change-password')
  async setNewPassword(@Body() data: NewPasswordDto) {
    return this.service.changeTenantUserPassword(data);
  }
}
