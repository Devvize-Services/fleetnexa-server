import { Module, forwardRef } from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { CustomerController } from './customer.controller.js';
import { CustomerRepository } from './customer.repository.js';
import { CustomerViolationModule } from './modules/customer-violation/customer-violation.module.js';

@Module({
  imports: [forwardRef(() => CustomerViolationModule)],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository],
  exports: [CustomerService],
})
export class CustomerModule {}
