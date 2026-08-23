import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { FirmaModule } from '../../../infrastructure/firma/firma.module';
import { CustomerModule } from '../../../modules/customer/customer.module';
import { TenantExtrasModule } from '../../../modules/tenant/tenant-extra/tenant-extra.module';
import { AwsModule } from '../../../infrastructure/aws/aws.module';
@Module({
  imports: [TenantExtrasModule, CustomerModule, FirmaModule, AwsModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
