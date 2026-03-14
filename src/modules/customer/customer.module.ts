import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { CustomerController } from './customer.controller.js';
import { CustomerRepository } from './customer.repository.js';

@Module({
  imports: [],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository],
  exports: [CustomerService],
})
export class CustomerModule {}
