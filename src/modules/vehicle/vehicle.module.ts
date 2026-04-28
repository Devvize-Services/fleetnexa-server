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
import { PrismaModule } from '../../prisma/prisma.module.js';
import { VehicleMaintenanceModule } from './modules/vehicle-maintenance/vehicle-maintenance.module.js';
import { VehicleDamageModule } from './modules/vehicle-damage/vehicle-damage.module.js';
import { UserRepository } from '../user/user.repository.js';
import { VehicleBookingService } from './services/vehicle-booking.service.js';
import { VehicleLocationService } from './services/vehicle-location.service.js';
import { VehiclePricingService } from './services/vehicle-pricing.service.js';
import { VehicleStatusService } from './services/vehicle-status.service.js';

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
    VehicleBookingService,
    VehicleLocationService,
    VehiclePricingService,
    VehicleStatusService,
    VehicleRepository,
    ApiGuard,
    TenantRepository,
    UserRepository,
    BookingRepository,
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
