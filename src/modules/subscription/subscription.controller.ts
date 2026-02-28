import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { LocalAuthGuard } from '../auth/guards/local.guard.js';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(LocalAuthGuard)
  @Post(':id')
  async updateSubscription(
    @Param('id') planId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.subscriptionService.updateSubscription(planId, tenant);
  }
}
