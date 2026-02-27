import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StorefrontBookingController } from './storefront-booking.controller.js';
import { StorefrontBookingService } from './storefront-booking.service.js';
import { StorefrontCustomerModule } from '../../../modules/customer/storefront-customer/storefront-customer.module.js';
import { TenantNotificationModule } from '../../../modules/tenant/tenant-notification/tenant-notification.module.js';
import { StorefrontGuard } from '../../../common/guards/storefront.guard.js';
import jwtConfig from '../../../config/jwt.config.js';

@Module({
  imports: [
    StorefrontCustomerModule,
    TenantNotificationModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [StorefrontBookingController],
  providers: [StorefrontBookingService, StorefrontGuard],
  exports: [],
})
export class StorefrontBookingModule {}
