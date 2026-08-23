import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class PaymentDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  paymentDate: string;

  @IsString()
  notes: string;

  @IsString()
  @IsOptional()
  currencyId: string;

  @IsString()
  bookingId: string;

  @IsString()
  paymentMethodId: string;

  @IsString()
  paymentTypeId: string;

  @IsString()
  customerId: string;

  @IsBoolean()
  emailReceipt?: boolean = false;
}
