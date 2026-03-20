import { Module } from '@nestjs/common';
import { VehicleDamageService } from './vehicle-damage.service.js';
import { VehicleDamageController } from './vehicle-damage.controller.js';
import { TenantRepository } from '../../../../modules/tenant/tenant.repository.js';
import { UserRepository } from '../../../../modules/user/user.repository.js';

@Module({
  imports: [],
  providers: [VehicleDamageService, TenantRepository, UserRepository],
  exports: [VehicleDamageService],
  controllers: [VehicleDamageController],
})
export class VehicleDamageModule {}
