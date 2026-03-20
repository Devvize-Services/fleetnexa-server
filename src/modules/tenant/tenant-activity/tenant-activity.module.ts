import { Module } from '@nestjs/common';
import { TenantActivityController } from './tenant-activity.controller.js';
import { TenantActivityService } from './tenant-activity.service.js';
import { TenantRepository } from '../tenant.repository.js';
import { UserRepository } from '../../../modules/user/user.repository.js';

@Module({
  imports: [],
  controllers: [TenantActivityController],
  providers: [TenantActivityService, TenantRepository, UserRepository],
  exports: [TenantActivityService],
})
export class TenantActivityModule {}
