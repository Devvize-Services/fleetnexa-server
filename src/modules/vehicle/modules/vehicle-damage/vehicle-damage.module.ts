import { Module } from '@nestjs/common';
import { VehicleDamageService } from './vehicle-damage.service.js';
import { VehicleDamageController } from './vehicle-damage.controller.js';
import { TenantRepository } from '../../../../modules/tenant/tenant.repository.js';
import { TenantUserRepository } from '../../../../modules/user/tenant-user/tenant-user.repository.js';

@Module({
  imports: [],
  providers: [VehicleDamageService, TenantRepository, TenantUserRepository],
  exports: [VehicleDamageService],
  controllers: [VehicleDamageController],
})
export class VehicleDamageModule {}
