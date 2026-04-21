import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserRoleService } from './user-role.service.js';
import { UserRoleDto, UserRolePermissionsDto } from './user-role.dto.js';
import { JwtAuthGuard } from '../../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../../common/enums/role.enum.js';
import { Roles } from '../../../../modules/auth/decorator/role.decorator.js';

@Controller('user/role')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class UserRoleController {
  constructor(private readonly service: UserRoleService) {}

  @Get()
  async getUserRole(@Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.getRoleByUser(tenant, user);
  }

  @Get('all')
  async getAllRoles(@Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.getAllRoles(tenant);
  }

  @Post()
  async createUserRole(@Request() req, @Body() data: UserRoleDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.createUserRole(data, tenant);
  }

  @Put('assign')
  async assignPermissionsToRole(
    @Request() req,
    @Body() data: UserRolePermissionsDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.assignPermissionsToRole(data, tenant, user);
  }

  @Put()
  async updateUserRole(@Request() req, @Body() data: UserRoleDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateUserRole(data, tenant, user);
  }

  @Delete(':id')
  async deleteUserRole(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteUserRole(id, tenant, user);
  }
}
