import { Module } from '@nestjs/common';
import { TenantCustomerController } from './tenant-customer.controller.js';
import { TenantCustomerService } from './tenant-customer.service.js';
import { TenantCustomerRepository } from './tenant-customer.repository.js';

@Module({
  imports: [],
  controllers: [TenantCustomerController],
  providers: [TenantCustomerService, TenantCustomerRepository],
  exports: [TenantCustomerService],
})
export class TenantCustomerModule {}
