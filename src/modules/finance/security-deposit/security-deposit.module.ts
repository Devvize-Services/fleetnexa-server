import { forwardRef, Module } from '@nestjs/common';
import { SecurityDepositService } from './security-deposit.service';
import { SecurityDepositController } from './security-deposit.controller';
import { BookingRepository } from '../../../modules/booking/booking.repository';
import { CustomerModule } from '../../../modules/customer/customer.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../../../config/jwt.config';
import { TransactionModule } from '../../../modules/transaction/transaction.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    CustomerModule,
    PaymentModule,
  ],
  controllers: [SecurityDepositController],
  providers: [SecurityDepositService, BookingRepository],
  exports: [SecurityDepositService],
})
export class SecurityDepositModule {}
