import { Module, forwardRef } from '@nestjs/common';
import { CustomerViolationService } from './customer-violation.service.js';
import { CustomerViolationController } from './customer-violation.controller.js';
import { CustomerModule } from '../../customer.module.js';

@Module({
  imports: [forwardRef(() => CustomerModule)],
  controllers: [CustomerViolationController],
  providers: [CustomerViolationService],
  exports: [CustomerViolationService],
})
export class CustomerViolationModule {}
