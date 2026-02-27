import { Module } from '@nestjs/common';
import { TenantRatesService } from './tenant-rates.service.js';
import { TenantRepository } from '../tenant.repository.js';
import { TenantUserRepository } from '../../user/tenant-user/tenant-user.repository.js';
import { TenantRatesController } from './tenant-rates.controller.js';

@Module({
  imports: [],
  controllers: [TenantRatesController],
  providers: [TenantRatesService, TenantRepository, TenantUserRepository],
  exports: [TenantRatesService],
})
export class TenantRatesModule {}
