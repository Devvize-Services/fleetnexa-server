import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { SecurityDepositStatus } from 'src/generated/prisma/enums';

export class BookingExtrasDto {
  @IsUUID()
  id: string;

  @IsUUID()
  extraId: string;

  @IsNumber()
  amount: number;

  @IsBoolean()
  @IsOptional()
  customAmount?: boolean = false;

  @IsUUID()
  valuesId: string;
}

export class BookingDriverDto {
  @IsUUID()
  id: string;

  @IsString()
  driverId: string;

  @IsUUID()
  @IsOptional()
  rentalId: string;

  @IsBoolean()
  isPrimary: boolean;
}

export class BookingValuesDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(1)
  numberOfDays: number;

  @IsNumber()
  basePrice: number;

  @IsBoolean()
  @IsOptional()
  customBasePrice?: boolean = false;

  @IsNumber()
  totalCost: number;

  @IsBoolean()
  @IsOptional()
  customTotalCost?: boolean = false;

  @IsNumber()
  discount: number;

  @IsBoolean()
  @IsOptional()
  customDiscount?: boolean = false;

  @IsNumber()
  deliveryFee: number;

  @IsBoolean()
  @IsOptional()
  customDeliveryFee?: boolean = false;

  @IsNumber()
  collectionFee: number;

  @IsBoolean()
  @IsOptional()
  customCollectionFee?: boolean = false;

  @IsNumber()
  deposit: number;

  @IsBoolean()
  @IsOptional()
  customDeposit?: boolean = false;

  @IsNumber()
  totalExtras: number;

  @IsNumber()
  subTotal: number;

  @IsNumber()
  netTotal: number;

  @IsNumber()
  amountDue: number;

  @IsNumber()
  discountAmount: number;

  @IsString()
  discountPolicy: string;

  @IsNumber()
  additionalDriverFees: number;

  @IsObject()
  @IsOptional()
  extras?: BookingExtrasDto[];
}
