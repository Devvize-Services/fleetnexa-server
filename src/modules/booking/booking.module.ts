import { Module } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { BookingController } from './booking.controller.js';
import { BookingRepository } from './booking.repository.js';
import { VehicleEventModule } from '../vehicle/modules/vehicle-event/vehicle-event.module.js';
import { VehicleModule } from '../vehicle/vehicle.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { BookingWorkflowService } from './services/booking-workflow.service.js';
import { BookingCreationService } from './services/booking-creation.service.js';
import { BookingActivityService } from './services/booking-activity.service.js';
import { CustomerRepository } from '../customer/customer.repository.js';
import { TenantNotificationModule } from '../tenant/tenant-notification/tenant-notification.module.js';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { BookingVehicleService } from './services/booking-vehicle.service.js';
import { BookingCalculationService } from './services/booking-calculation.service.js';
import { BookingChargeService } from './services/booking-charge.service.js';
import { BookingDepositService } from './services/booking-deposit.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { FinanceModule } from '../finance/finance.module.js';
import { PaymentService } from '../finance/payment/payment.service.js';

@Module({
  imports: [
    PrismaModule,
    VehicleModule,
    CustomerModule,
    TransactionModule,
    VehicleEventModule,
    TenantNotificationModule,
    FinanceModule,
  ],
  controllers: [BookingController],
  providers: [
    BookingActivityService,
    BookingCalculationService,
    BookingChargeService,
    BookingCreationService,
    BookingDepositService,
    BookingRepository,
    BookingService,
    BookingVehicleService,
    BookingWorkflowService,
    CustomerRepository,
    CustomerService,
    PaymentService,
  ],
  exports: [BookingService],
})
export class BookingModule {}
