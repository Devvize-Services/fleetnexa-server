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

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currencyId: string;

  @IsEnum(SecurityDepositTransactionType)
  action?: SecurityDepositTransactionType;

  @IsString()
  @IsOptional()
  notes?: string;
}
