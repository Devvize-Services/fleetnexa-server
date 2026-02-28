import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { TenantActivityService } from './tenant-activity.service.js';
import { LocalAuthGuard } from '../../auth/guards/local.guard.js';

@Controller('tenant/activity')
@UseGuards(LocalAuthGuard)
export class TenantActivityController {
  constructor(private readonly service: TenantActivityService) {}

  @Get()
  async getActivities(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantActivities(tenant);
  }
}
