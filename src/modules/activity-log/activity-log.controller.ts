import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from '../../shared/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { ActivityLogService } from './activity-log.service.js';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  getActivities(@Request() req) {
    const { tenant } = req.user;
    return this.service.getActivities(tenant);
  }
}
