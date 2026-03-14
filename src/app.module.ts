import { Module } from '@nestjs/common';
import { TenantModule } from './modules/tenant/tenant.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { TenantLocationModule } from './modules/tenant/tenant-location/tenant-location.module.js';
import { TenantRatesModule } from './modules/tenant/tenant-rates/tenant-rates.module.js';
import { TenantActivityModule } from './modules/tenant/tenant-activity/tenant-activity.module.js';
import { TenantExtrasModule } from './modules/tenant/tenant-extra/tenant-extra.module.js';
import { TenantNotificationModule } from './modules/tenant/tenant-notification/tenant-notification.module.js';
import { SocketModule } from './gateway/socket.module.js';
import { TenantReviewModule } from './modules/tenant/tenant-review/tenant-review.module.js';
import { TenantVendorModule } from './modules/tenant/tenant-vendor/tenant-vendor.module.js';
import { TenantViolationModule } from './modules/tenant/tenant-violation/tenant-violation.module.js';
import { StorefrontBookingModule } from './modules/booking/storefront-booking/storefront-booking.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { VehicleModule } from './modules/vehicle/vehicle.module.js';
import { StorefrontAuthModule } from './modules/auth/storefront-auth/storefront-auth.module.js';
import { StorefrontUserModule } from './modules/user/storefront-user/storefront-user.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { TenantUserModule } from './modules/user/tenant-user/tenant-user.module.js';
import { VehicleMaintenanceModule } from './modules/vehicle/modules/vehicle-maintenance/vehicle-maintenance.module.js';
import { TenantCustomerModule } from './modules/customer/tenant-customer/tenant-customer.module.js';
import { PaymentModule } from './modules/transaction/modules/payment/payment.module.js';
import { UserRoleModule } from './modules/user/tenant-user/modules/user-role/user-role.module.js';
import { RefundModule } from './modules/transaction/modules/refund/refund.module.js';
import { ExpenseModule } from './modules/transaction/modules/expense/expense.module.js';
import { TransactionModule } from './modules/transaction/transaction.module.js';
import { DocumentModule } from './modules/document/document.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { VehicleDamageModule } from './modules/vehicle/modules/vehicle-damage/vehicle-damage.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { GeneratorModule } from './common/generator/generator.module.js';
import { FormatterModule } from './common/formatter/formatter.module.js';
import { EmailModule } from './common/email/email.module.js';
import { WhatsappModule } from './common/whatsapp/whatsapp.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminAuthModule } from './modules/auth/admin-auth/admin-auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { SubscriptionModule } from './modules/subscription/subscription.module.js';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60 * 1000,
          limit: 100,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    // CronModule,
    HealthModule,
    GeneratorModule,
    FormatterModule,
    DocumentModule,
    EmailModule,
    WhatsappModule,

    AdminModule,

    DashboardModule,

    StorefrontAuthModule,
    StorefrontUserModule,
    AuthModule,
    AdminAuthModule,

    StorefrontBookingModule,
    BookingModule,

    TenantCustomerModule,

    UserRoleModule,
    TenantUserModule,
    UserModule,

    TenantLocationModule,
    TenantRatesModule,
    TenantActivityModule,
    TenantExtrasModule,
    TenantNotificationModule,
    TenantReviewModule,
    TenantVendorModule,
    TenantViolationModule,
    TenantModule,

    PaymentModule,
    RefundModule,
    ExpenseModule,
    TransactionModule,

    VehicleMaintenanceModule,
    VehicleDamageModule,
    VehicleModule,

    SocketModule,
    StorageModule,
    DocumentModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
