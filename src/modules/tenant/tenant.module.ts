import { Module } from '@nestjs/common';
import { TenantLocationModule } from './tenant-location/tenant-location.module.js';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TenantUserModule } from '../user/tenant-user/tenant-user.module.js';
import { TenantUserRepository } from '../user/tenant-user/tenant-user.repository.js';
import { UserRoleModule } from '../user/tenant-user/modules/user-role/user-role.module.js';
import { TenantExtrasModule } from './tenant-extra/tenant-extra.module.js';
import { TenantController } from './tenant.controller.js';
import { TenantRepository } from './tenant.repository.js';
import { TenantService } from './tenant.service.js';
import { TenantNotificationModule } from './tenant-notification/tenant-notification.module.js';
import { TenantVendorModule } from './tenant-vendor/tenant-vendor.module.js';
import { VehicleModule } from '../vehicle/vehicle.module.js';
import { TenantCustomerModule } from '../customer/tenant-customer/tenant-customer.module.js';
import { TenantActivityModule } from './tenant-activity/tenant-activity.module.js';
import { TenantRatesModule } from './tenant-rates/tenant-rates.module.js';
import { TenantBookingModule } from '../booking/tenant-booking/tenant-booking.module.js';
import { VehicleMaintenanceModule } from '../vehicle/modules/vehicle-maintenance/vehicle-maintenance.module.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import jwtConfig from '../../config/jwt.config.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TenantLocationModule,
    TenantExtrasModule,
    TenantUserModule,
    TenantNotificationModule,
    UserRoleModule,
    TenantVendorModule,
    VehicleModule,
    TenantCustomerModule,
    TenantActivityModule,
    TenantRatesModule,
    TenantBookingModule,
    VehicleMaintenanceModule,
  ],
  controllers: [TenantController],
  providers: [
    JwtService,
    TenantService,
    TenantRepository,
    TenantUserRepository,
    JwtStrategy,
  ],
  exports: [TenantService, TenantRepository, TenantUserRepository],
})
export class TenantModule {}
