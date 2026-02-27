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
import { TenantVendorService } from './tenant-vendor.service.js';
import type { AuthenticatedRequest } from '../../../types/authenticated-request.js';
import { TenantVendorDto } from './tenant-vendor.dto.js';
import { TenantAuthGuard } from '../../../modules/auth/guards/tenant-auth.guard.js';

@Controller('tenant/vendor')
@UseGuards(TenantAuthGuard)
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
