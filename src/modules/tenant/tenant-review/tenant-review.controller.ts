import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { TenantReviewService } from './tenant-review.service.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';
import { RateTenantDto } from '../dto/rate-tenant.dto.js';

@Controller('tenant/review')
export class TenantReviewController {
  constructor(private readonly service: TenantReviewService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getReviews(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantReviews(tenant);
  }

  @Post()
  async addReview(@Body() data: RateTenantDto) {
    return this.service.addTenantReview(data);
  }
}
