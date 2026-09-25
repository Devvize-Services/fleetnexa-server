import { Module } from '@nestjs/common';
import { BookingActionService } from './booking-action.service';
import { BookingActionController } from './booking-action.controller';
import { BookingRepository } from '../booking.repository';
import { BookingActivityService } from '../services/booking-activity.service';
import { VehicleModule } from '../../../modules/vehicle/vehicle.module';
import { InvoiceModule } from '../../../modules/finance/invoice/invoice.module';
import { CustomerModule } from '../../../modules/customer/customer.module';

@Module({
  imports: [VehicleModule, InvoiceModule, CustomerModule],
  controllers: [BookingActionController],
  providers: [BookingActionService, BookingRepository, BookingActivityService],
})
export class BookingActionModule {}
