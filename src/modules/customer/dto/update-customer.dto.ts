import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto.js';
import { IsUUID } from 'class-validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsUUID()
  id: string;
}
