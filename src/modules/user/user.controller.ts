import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { Request } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { NewPasswordDto } from './dto/new-password.dto.js';
import { TenantUserDto } from './dto/tenant-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { DeleteUserDto } from './dto/delete-user.dto.js';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  @Roles(Role.TENANT_USER)
  async getCurrentUser(@Request() req) {
    const user = req.user;
    return this.service.getCurrentUser(user.id, user.serverRole);
  }

  @Get()
  @Roles(Role.TENANT_USER)
  async getTenantUsers(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantUsers(tenant);
  }

  @Post()
  @Roles(Role.TENANT_USER)
  async createUser(@Request() req, @Body() data: TenantUserDto) {
    const { tenant } = req.user;
    return this.service.createTenantUser(data, tenant);
  }

  @Put()
  @Roles(Role.TENANT_USER)
  async updateUser(@Request() req, @Body() data: TenantUserDto) {
    const { tenant } = req.user;
    return this.service.updateTenantUser(data, tenant);
  }

  @Delete('storefront')
  @Roles(Role.TENANT_USER)
  async deleteStorefrontUser(@Request() req, @Body() data: DeleteUserDto) {
    return this.service.deleteStorefrontUser(data.id, data.password);
  }

  @Delete('id/:id')
  @Roles(Role.TENANT_USER)
  async deleteUser(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    return this.service.deleteTenantUser(id, tenant);
  }

  @Patch('password')
  @Roles(Role.TENANT_USER)
  async updateUserPassword(@Request() req, @Body() data: ChangePasswordDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateUserPassword(data, tenant, user.id);
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
