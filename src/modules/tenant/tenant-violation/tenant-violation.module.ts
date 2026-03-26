import { Module } from '@nestjs/common';
import { TenantViolationService } from './tenant-violation.service.js';
import { TenantRepository } from '../tenant.repository.js';
import { TenantViolationController } from './tenant-violation.controller.js';
import { UserRepository } from '../../../modules/user/user.repository.js';

@Module({
  imports: [],
  controllers: [TenantViolationController],
  providers: [TenantViolationService, TenantRepository, UserRepository],
  exports: [TenantViolationService],
})
export class TenantViolationModule {}
