import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { TenantReviewService } from './tenant-review.service.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';

@Controller('tenant/review')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class TenantReviewController {
  constructor(private readonly service: TenantReviewService) {}

  @Get()
  async getReviews(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantReviews(tenant);
  }
}
