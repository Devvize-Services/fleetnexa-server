import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TransactionModule } from '../../transaction.module.js';
import { RefundController } from './refund.controller.js';
import { RefundService } from './refund.service.js';
import { TenantRepository } from '../../../../modules/tenant/tenant.repository.js';
import { TenantUserRepository } from '../../../../modules/user/tenant-user/tenant-user.repository.js';
import { TenantBookingRepository } from '../../../../modules/booking/tenant-booking/tenant-booking.repository.js';
import jwtConfig from '../../../../config/jwt.config.js';

@Module({
  imports: [
    TransactionModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [RefundController],
  providers: [
    RefundService,
    TenantRepository,
    TenantUserRepository,
    TenantBookingRepository,
  ],
  exports: [RefundService],
})
export class RefundModule {}
