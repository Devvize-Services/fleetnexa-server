import { Module } from '@nestjs/common';
import { TenantBookingController } from './tenant-booking.controller.js';
import { TenantBookingService } from './tenant-booking.service.js';
import { TenantBookingRepository } from './tenant-booking.repository.js';
import { VehicleModule } from '../../../modules/vehicle/vehicle.module.js';
import { CustomerModule } from '../../../modules/customer/customer.module.js';
import { TransactionModule } from '../../../modules/transaction/transaction.module.js';
import { VehicleEventModule } from '../../../modules/vehicle/modules/vehicle-event/vehicle-event.module.js';

@Module({
  imports: [
    VehicleModule,
    CustomerModule,
    TransactionModule,
    VehicleEventModule,
  ],
  controllers: [TenantBookingController],
  providers: [TenantBookingService, TenantBookingRepository],
  exports: [TenantBookingService],
})
export class TenantBookingModule {}
