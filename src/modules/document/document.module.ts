import { Global, Module } from '@nestjs/common';
import { TenantExtrasModule } from '../tenant/tenant-extra/tenant-extra.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { DocumentService } from './document.service.js';
import { DocumentController } from './document.controller.js';
import { FirmaModule } from '../../infrastructure/firma/firma.module.js';

@Global()
@Module({
  imports: [TenantExtrasModule, CustomerModule, FirmaModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
