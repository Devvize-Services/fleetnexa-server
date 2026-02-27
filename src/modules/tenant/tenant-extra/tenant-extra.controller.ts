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
import { TenantExtraService } from './tenant-extra.service.js';
import type { AuthenticatedRequest } from 'src/types/authenticated-request.js';
import { TenantExtraDto } from './tenant-extra.dto.js';
import { TenantAuthGuard } from '../../../modules/auth/guards/tenant-auth.guard.js';

@Controller('tenant/extra')
@UseGuards(TenantAuthGuard)
export class TenantExtraController {
  constructor(private readonly service: TenantExtraService) {}

  @Get()
  async getTenantExtras(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantExtras(tenant);
  }

  @Post()
  async addTenantExtra(@Request() req, @Body() data: TenantExtraDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.createTenantExtra(data, tenant, user);
  }

  @Put()
  async updateTenantExtra(@Request() req, @Body() data: TenantExtraDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateTenantExtra(data, tenant, user);
  }

  @Delete(':type/:id')
  async deleteTenantExtra(
    @Request() req,
    @Param('type') type: 'service' | 'equipment' | 'insurance',
    @Param('id') id: string,
  ) {
    const { tenant } = req.user;
    const user = req.user;

    switch (type) {
      case 'service':
        return this.service.deleteService(id, tenant, user);
      case 'equipment':
        return this.service.deleteEquipment(id, tenant, user);
      case 'insurance':
        return this.service.deleteInsurance(id, tenant, user);
      default:
        throw new Error('Invalid tenant extra type');
    }
  }
}
