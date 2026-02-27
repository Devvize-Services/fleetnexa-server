import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller.js';
import { VehicleService } from './vehicle.service.js';
import { VehicleRepository } from './vehicle.repository.js';
import { TenantExtrasModule } from '../tenant/tenant-extra/tenant-extra.module.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { TenantUserRepository } from '../user/tenant-user/tenant-user.repository.js';
import { StorageModule } from '../storage/storage.module.js';
import { ApiGuard } from '../../common/guards/api.guard.js';
import { TenantBookingRepository } from '../booking/tenant-booking/tenant-booking.repository.js';
import { VehicleEventModule } from './modules/vehicle-event/vehicle-event.module.js';

@Module({
  imports: [TenantExtrasModule, StorageModule, VehicleEventModule],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    VehicleRepository,
    ApiGuard,
    TenantRepository,
    TenantUserRepository,
    TenantBookingRepository,
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
