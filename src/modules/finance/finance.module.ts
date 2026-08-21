import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { InvoiceModule } from './invoice/invoice.module';
import { ActivityModule } from '../../common/activity/activity.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [InvoiceModule, ActivityModule, PaymentsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [InvoiceModule, FinanceService],
})
export class FinanceModule {}
