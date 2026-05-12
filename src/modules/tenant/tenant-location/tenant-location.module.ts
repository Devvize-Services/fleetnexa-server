import { Module } from '@nestjs/common';
import { TenantLocationService } from './tenant-location.service.js';
import { TenantLocationController } from './tenant-location.controller.js';
import { TenantRepository } from '../tenant.repository.js';
import { UserRepository } from '../../../modules/user/user.repository.js';

@Module({
  imports: [],
  controllers: [TenantLocationController],
  providers: [TenantLocationService, TenantRepository, UserRepository],
  exports: [TenantLocationService],
})
export class TenantLocationModule {}
