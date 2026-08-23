import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../../../config/jwt.config';
import { TransactionModule } from '../../../modules/transaction/transaction.module';
import { BookingRepository } from '../../../modules/booking/booking.repository';
import { CustomerModule } from 'src/modules/customer/customer.module';

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    CustomerModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, BookingRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
