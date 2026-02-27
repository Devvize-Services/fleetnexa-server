import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { TenantActivityService } from './tenant-activity.service.js';
import { TenantAuthGuard } from '../../../modules/auth/guards/tenant-auth.guard.js';

@Controller('tenant/activity')
@UseGuards(TenantAuthGuard)
export class TenantActivityController {
  constructor(private readonly service: TenantActivityService) {}

  @Get()
  async getActivities(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantActivities(tenant);
  }
}
