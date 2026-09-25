import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { RentalAction, RentalStatus } from '../../../generated/prisma/enums.js';

export class ActionBookingDto {
  @IsUUID()
  bookingId: string;

  @IsEnum(RentalAction)
  action: RentalAction;

  @IsEnum(RentalStatus)
  status: RentalStatus;

  @IsString()
  vehicleStatus: string;

  @IsString()
  @ValidateIf((o) => o.status === RentalAction.RETURNED)
  returnDate: string;

  @IsString()
  @IsOptional()
  declineReason: string;

  @IsBoolean()
  @ValidateIf((o) => o.status === RentalAction.RETURNED)
  lateFeeApplied?: boolean = false;

  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.status === RentalAction.RETURNED && o.lateFeeApplied)
  lateFee?: number;

  @IsBoolean()
  sendEmail: boolean = false;

  @IsBoolean()
  includeAgreement: boolean = false;

  @IsBoolean()
  includeInvoice: boolean = false;
}
