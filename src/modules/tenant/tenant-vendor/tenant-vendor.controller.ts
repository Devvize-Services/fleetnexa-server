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
import { TenantVendorService } from './tenant-vendor.service.js';
import { TenantVendorDto } from './tenant-vendor.dto.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';

@Controller('tenant/vendor')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
export class TenantVendorController {
  constructor(private readonly service: TenantVendorService) {}

  @Get()
  async getTenantVendors(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantVendors(tenant);
  }

  @Post()
  async createTenantVendor(@Request() req, @Body() data: TenantVendorDto) {
    const { tenant } = req.user;
    return this.service.createTenantVendor(data, tenant);
  }

  @Put()
  async updateTenantVendor(@Request() req, @Body() data: TenantVendorDto) {
    const { tenant, user } = req.user;
    return this.service.updateTenantVendor(data, tenant, user);
  }

  @Delete(':id')
  async deleteTenantVendor(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteTenantVendor(id, tenant, user);
  }
}
