import { Module } from '@nestjs/common';
import { TenantModule } from './modules/tenant/tenant.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { VehicleModule } from './modules/vehicle/vehicle.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { TransactionModule } from './modules/transaction/transaction.module.js';
import { DocumentModule } from './modules/document/document.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './modules/cron/cron.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { GeneratorModule } from './common/generator/generator.module.js';
import { FormatterModule } from './common/formatter/formatter.module.js';
import { EmailModule } from './common/email/email.module.js';
import { WhatsappModule } from './common/whatsapp/whatsapp.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { SubscriptionModule } from './modules/subscription/subscription.module.js';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { UserModule } from './modules/user/user.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { NotificationModule } from './infrastructure/notification/notification.module.js';
import { SentDmModule } from './infrastructure/sentdm/sentdm.module.js';
import { ResendModule } from './infrastructure/resend/resend.module.js';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { ActivityModule } from './common/activity/activity.module.js';
import { FinanceModule } from './modules/finance/finance.module';
import { PdfMonkeyModule } from './infrastructure/pdfMonkey/pdfMonkey.module.js';
import { AwsModule } from './infrastructure/aws/aws.module.js';

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
    ActivityModule,

    ResendModule,
    SentDmModule,
    PdfMonkeyModule,
    RealtimeModule,
    AwsModule,

    FinanceModule,

    AdminModule,

    DashboardModule,

    AuthModule,

    BookingModule,

    CustomerModule,

    UserModule,

    TenantModule,
    TransactionModule,
    VehicleModule,

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
