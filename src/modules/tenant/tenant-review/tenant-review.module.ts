import { Module } from '@nestjs/common';
import { TenantReviewService } from './tenant-review.service.js';
import { TenantReviewController } from './tenant-review.controller.js';
import { TenantRepository } from '../tenant.repository.js';
import { TenantUserRepository } from '../../user/tenant-user/tenant-user.repository.js';

@Module({
  imports: [],
  providers: [TenantReviewService, TenantRepository, TenantUserRepository],
  controllers: [TenantReviewController],
  exports: [TenantReviewService],
})
export class TenantReviewModule {}
