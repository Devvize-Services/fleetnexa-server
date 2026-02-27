import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { TransactionModule } from '../../transaction.module.js';
import { TenantBookingRepository } from '../../../../modules/booking/tenant-booking/tenant-booking.repository.js';
import jwtConfig from '../../../../config/jwt.config.js';

@Module({
  imports: [
    TransactionModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, TenantBookingRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
