import { Module } from '@nestjs/common';
import { TenantReviewService } from './tenant-review.service.js';
import { TenantReviewController } from './tenant-review.controller.js';
import { TenantRepository } from '../tenant.repository.js';
import { UserRepository } from '../../../modules/user/user.repository.js';

@Module({
  imports: [],
  providers: [TenantReviewService, TenantRepository, UserRepository],
  controllers: [TenantReviewController],
  exports: [TenantReviewService],
})
export class TenantReviewModule {}
