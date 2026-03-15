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
import { TenantExtraService } from './tenant-extra.service.js';
import { TenantExtraDto } from './tenant-extra.dto.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';

@Controller('tenant/extra')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
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
