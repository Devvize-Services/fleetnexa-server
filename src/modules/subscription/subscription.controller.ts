import { Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post(':id')
  async updateSubscription(@Param('id') planId: string, @Request() req) {
    const { tenant } = req.user;
    return this.subscriptionService.updateSubscription(planId, tenant);
  }
}
