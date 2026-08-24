import { forwardRef, Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller.js';
import { VehicleService } from './vehicle.service.js';
import { VehicleRepository } from './vehicle.repository.js';
import { TenantExtrasModule } from '../tenant/tenant-extra/tenant-extra.module.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { StorageModule } from '../storage/storage.module.js';
import { ApiGuard } from '../auth/guards/api.guard.js';
import { VehicleEventModule } from './modules/vehicle-event/vehicle-event.module.js';
import { BookingRepository } from '../booking/booking.repository.js';
import { VehicleMaintenanceModule } from './modules/vehicle-maintenance/vehicle-maintenance.module.js';
import { VehicleDamageModule } from './modules/vehicle-damage/vehicle-damage.module.js';
import { UserRepository } from '../user/user.repository.js';
import { VehicleLocationService } from './services/vehicle-location.service.js';
import { VehiclePricingService } from './services/vehicle-pricing.service.js';
import { VehicleStatusService } from './services/vehicle-status.service.js';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { VehicleOdometerService } from './services/vehicle-odometer.service.js';

@Module({
  imports: [
    PrismaModule,
    TenantExtrasModule,
    StorageModule,
    forwardRef(() => VehicleEventModule),
    forwardRef(() => VehicleMaintenanceModule),
    forwardRef(() => VehicleDamageModule),
  ],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    VehicleLocationService,
    VehiclePricingService,
    VehicleStatusService,
    VehicleRepository,
    VehicleOdometerService,
    ApiGuard,
    TenantRepository,
    UserRepository,
    BookingRepository,
  ],
  exports: [VehicleService, VehicleStatusService],
})
export class VehicleModule {}
