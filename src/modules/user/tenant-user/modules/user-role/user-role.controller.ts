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
} from '@nestjs/common';
import { UserRoleService } from './user-role.service.js';
import type { AuthenticatedRequest } from '../../../../../types/authenticated-request.js';
import { UserRoleDto, UserRolePermissionsDto } from './user-role.dto.js';
import { LocalAuthGuard } from '../../../../auth/guards/local.guard.js';

@Controller('tenant/user/role')
@UseGuards(LocalAuthGuard)
export class UserRoleController {
  constructor(private readonly service: UserRoleService) {}

  @Get()
  async getUserRole(@Req() req: AuthenticatedRequest) {
    const { tenant, user } = req.context;
    return this.service.getRoleByUser(tenant, user);
  }

  @Get('all')
  async getAllRoles(@Req() req: AuthenticatedRequest) {
    const tenant = req.context.tenant;
    return this.service.getAllRoles(tenant);
  }

  @Post()
  async createUserRole(
    @Req() req: AuthenticatedRequest,
    @Body() data: UserRoleDto,
  ) {
    const { tenant } = req.context;
    return this.service.createUserRole(data, tenant);
  }

  @Put('assign')
  async assignPermissionsToRole(
    @Req() req: AuthenticatedRequest,
    @Body() data: UserRolePermissionsDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.assignPermissionsToRole(data, tenant, user);
  }

  @Put()
  async updateUserRole(
    @Req() req: AuthenticatedRequest,
    @Body() data: UserRoleDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateUserRole(data, tenant, user);
  }

  @Delete(':id')
  async deleteUserRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { tenant, user } = req.context;
    return this.service.deleteUserRole(id, tenant, user);
  }
}
