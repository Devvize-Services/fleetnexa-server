import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
  ValidateIf,
} from 'class-validator';
import { TransactionType } from '../../generated/prisma/enums.js';

export class TransactionDto {
  @IsUUID()
  id: string;

  @IsNumber()
  amount: number;

  @IsString()
  transactionDate: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  createdBy: string;

  @IsUUID()
  @ValidateIf((o) => o.transactionType === TransactionType.PAYMENT)
  paymentId: string;

  @IsUUID()
  @ValidateIf((o) => o.transactionType === TransactionType.REFUND)
  refundId: string;

  @IsUUID()
  @ValidateIf((o) => o.transactionType === TransactionType.EXPENSE)
  expenseId: string;

  @IsUUID()
  @ValidateIf(
    (o) =>
      o.transactionType === TransactionType.SECURITY_DEPOSIT_COLLECTED ||
      o.transactionType === TransactionType.SECURITY_DEPOSIT_REFUNDED,
  )
  securityDepositId: string;

  @IsUUID()
  @IsOptional()
  rentalId: string;
}
