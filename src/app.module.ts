import { Module } from '@nestjs/common';
import { TenantModule } from './modules/tenant/tenant.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { SocketModule } from './gateway/socket.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { VehicleModule } from './modules/vehicle/vehicle.module.js';
import { StorefrontAuthModule } from './modules/auth/storefront-auth/storefront-auth.module.js';
import { StorefrontUserModule } from './modules/user/storefront-user/storefront-user.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { TransactionModule } from './modules/transaction/transaction.module.js';
import { DocumentModule } from './modules/document/document.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module.js';
import { HealthModule } from './modules/health/health.module.js';
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
import { CustomerModule } from './modules/customer/customer.module.js';
import { NotificationModule } from './common/notification/notification.module.js';

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
    CronModule,
    HealthModule,
    GeneratorModule,
    FormatterModule,
    DocumentModule,
    EmailModule,
    WhatsappModule,
    NotificationModule,

    AdminModule,

    DashboardModule,

    StorefrontAuthModule,
    StorefrontUserModule,
    AuthModule,
    AdminAuthModule,

    BookingModule,

    CustomerModule,

    UserModule,

    TenantModule,
    TransactionModule,
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
