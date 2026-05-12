import { Module } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { BookingController } from './booking.controller.js';
import { BookingRepository } from './booking.repository.js';
import { VehicleEventModule } from '../vehicle/modules/vehicle-event/vehicle-event.module.js';
import { VehicleModule } from '../vehicle/vehicle.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { BookingWorkflowService } from './services/booking-workflow.service.js';
import { BookingCreationService } from './services/booking-creation.service.js';
import { BookingActivityService } from './services/booking-activity.service.js';
import { CustomerRepository } from '../customer/customer.repository.js';
import { TenantNotificationModule } from '../tenant/tenant-notification/tenant-notification.module.js';

@Module({
  imports: [
    PrismaModule,
    VehicleModule,
    CustomerModule,
    TransactionModule,
    VehicleEventModule,
    TenantNotificationModule,
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingRepository,
    CustomerRepository,
    BookingWorkflowService,
    BookingCreationService,
    BookingActivityService,
  ],
  exports: [BookingService],
})
export class BookingModule {}
