import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { InvoiceModule } from './invoice/invoice.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [InvoiceModule, PaymentModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [InvoiceModule, FinanceService],
})
export class FinanceModule {}
