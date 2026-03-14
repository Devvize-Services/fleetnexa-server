import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller.js';
import { VehicleService } from './vehicle.service.js';
import { VehicleRepository } from './vehicle.repository.js';
import { TenantExtrasModule } from '../tenant/tenant-extra/tenant-extra.module.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { TenantUserRepository } from '../user/tenant-user/tenant-user.repository.js';
import { StorageModule } from '../storage/storage.module.js';
import { ApiGuard } from '../../common/guards/api.guard.js';
import { VehicleEventModule } from './modules/vehicle-event/vehicle-event.module.js';
import { BookingRepository } from '../booking/booking.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    TenantExtrasModule,
    StorageModule,
    VehicleEventModule,
  ],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    VehicleRepository,
    ApiGuard,
    TenantRepository,
    TenantUserRepository,
    BookingRepository,
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
