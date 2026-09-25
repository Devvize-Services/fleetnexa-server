import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SecurityDepositTransactionType } from 'src/generated/prisma/enums';

export class SecurityDepositDto {
  @IsString()
  bookingId: string;

  @IsString()
  paymentDate: string;

  @IsUUID()
  paymentMethodId: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  @IsOptional()
  currencyId: string;

  @IsEnum(SecurityDepositTransactionType)
  action?: SecurityDepositTransactionType;

  @IsString()
  @IsOptional()
  notes?: string;
}
