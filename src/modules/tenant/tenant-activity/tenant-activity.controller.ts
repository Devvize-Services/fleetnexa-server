import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { TenantActivityService } from './tenant-activity.service.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';

@Controller('tenant/activity')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
export class TenantActivityController {
  constructor(private readonly service: TenantActivityService) {}

  @Get()
  async getActivities(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantActivities(tenant);
  }
}
