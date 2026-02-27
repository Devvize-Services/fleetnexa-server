import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { TenantReviewService } from './tenant-review.service.js';
import type { AuthenticatedRequest } from '../../../types/authenticated-request.js';
import { TenantAuthGuard } from '../../auth/guards/tenant-auth.guard.js';

@Controller('tenant/review')
@UseGuards(TenantAuthGuard)
export class TenantReviewController {
  constructor(private readonly service: TenantReviewService) {}

  @Get()
  async getReviews(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantReviews(tenant);
  }
}
