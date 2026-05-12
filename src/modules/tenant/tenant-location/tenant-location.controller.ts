import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TenantLocationService } from './tenant-location.service.js';
import { TenantLocationDto } from './tenant.location.dto.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';
@Controller('tenant/location')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class TenantLocationController {
  constructor(private readonly service: TenantLocationService) {}

  @Get()
  async getAllTenantLocations(@Request() req) {
    const { tenant } = req.user;
    return this.service.getAllTenantLocations(tenant);
  }

  @Post()
  async createTenantLocation(@Request() req, @Body() data: TenantLocationDto) {
    const { tenant } = req.user;
    return this.service.createTenantLocation(data, tenant);
  }

  @Put()
  async updateTenantLocation(@Request() req, @Body() data: TenantLocationDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateTenantLocation(data, tenant, user);
  }

  @Delete(':id')
  async deleteTenantLocation(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteTenantLocation(id, tenant, user);
  }
}
