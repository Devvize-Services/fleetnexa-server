import { Global, Module } from '@nestjs/common';
import { PdfModule } from '../../common/pdf/pdf.module.js';
import { TenantExtrasModule } from '../tenant/tenant-extra/tenant-extra.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { DocumentService } from './document.service.js';
import { DocumentController } from './document.controller.js';
import { FirmaModule } from '../../common/firma/firma.module.js';

@Global()
@Module({
  imports: [PdfModule, TenantExtrasModule, CustomerModule, FirmaModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
