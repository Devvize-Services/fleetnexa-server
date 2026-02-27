import { Module } from '@nestjs/common';
import { TenantVendorController } from './tenant-vendor.controller.js';
import { TenantVendorService } from './tenant-vendor.service.js';
import { TenantRepository } from '../tenant.repository.js';
import { TenantUserRepository } from '../../user/tenant-user/tenant-user.repository.js';

@Module({
  imports: [],
  controllers: [TenantVendorController],
  providers: [TenantVendorService, TenantRepository, TenantUserRepository],
  exports: [TenantVendorService],
})
export class TenantVendorModule {}
