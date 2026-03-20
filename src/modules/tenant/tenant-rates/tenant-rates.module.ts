import { Module } from '@nestjs/common';
import { TenantRatesService } from './tenant-rates.service.js';
import { TenantRepository } from '../tenant.repository.js';
import { TenantRatesController } from './tenant-rates.controller.js';
import { UserRepository } from '../../../modules/user/user.repository.js';

@Module({
  imports: [],
  controllers: [TenantRatesController],
  providers: [TenantRatesService, TenantRepository, UserRepository],
  exports: [TenantRatesService],
})
export class TenantRatesModule {}
