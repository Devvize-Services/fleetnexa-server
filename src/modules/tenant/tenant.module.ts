import { Module } from '@nestjs/common';
import { TenantLocationModule } from './tenant-location/tenant-location.module.js';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserRoleModule } from '../user/tenant-user/modules/user-role/user-role.module.js';
import { TenantExtrasModule } from './tenant-extra/tenant-extra.module.js';
import { TenantController } from './tenant.controller.js';
import { TenantRepository } from './tenant.repository.js';
import { TenantService } from './tenant.service.js';
import { TenantNotificationModule } from './tenant-notification/tenant-notification.module.js';
import { TenantVendorModule } from './tenant-vendor/tenant-vendor.module.js';
import { VehicleModule } from '../vehicle/vehicle.module.js';
import { TenantActivityModule } from './tenant-activity/tenant-activity.module.js';
import { TenantRatesModule } from './tenant-rates/tenant-rates.module.js';
import { VehicleMaintenanceModule } from '../vehicle/modules/vehicle-maintenance/vehicle-maintenance.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import jwtConfig from '../../config/jwt.config.js';
import { ConfigModule } from '@nestjs/config';
import { CustomerModule } from '../customer/customer.module.js';
import { UserModule } from '../user/user.module.js';
import { UserRepository } from '../user/user.repository.js';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TenantLocationModule,
    TenantExtrasModule,
    UserModule,
    TenantNotificationModule,
    UserRoleModule,
    TenantVendorModule,
    VehicleModule,
    TenantActivityModule,
    TenantRatesModule,
    VehicleMaintenanceModule,
    BookingModule,
    CustomerModule,
  ],
  controllers: [TenantController],
  providers: [
    JwtService,
    TenantService,
    TenantRepository,
    UserRepository,
    JwtStrategy,
  ],
  exports: [TenantService, TenantRepository, UserRepository],
})
export class TenantModule {}
