import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { TransactionModule } from '../../transaction.module.js';
import jwtConfig from '../../../../config/jwt.config.js';
import { BookingRepository } from '../../../../modules/booking/booking.repository.js';

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, BookingRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
