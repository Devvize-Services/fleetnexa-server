import { Module } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { BookingController } from './booking.controller.js';
import { BookingRepository } from './booking.repository.js';
import { VehicleEventModule } from '../vehicle/modules/vehicle-event/vehicle-event.module.js';
import { VehicleModule } from '../vehicle/vehicle.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    VehicleModule,
    CustomerModule,
    TransactionModule,
    VehicleEventModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
