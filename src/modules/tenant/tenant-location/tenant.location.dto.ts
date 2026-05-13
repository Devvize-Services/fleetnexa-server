import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class TenantLocationDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  countryId: string;

  @IsString()
  @IsNotEmpty()
  stateId: string;

  @IsString()
  @IsNotEmpty()
  villageId: string;

  @IsBoolean()
  @IsNotEmpty()
  pickupEnabled: boolean;

  @IsBoolean()
  @IsNotEmpty()
  returnEnabled: boolean;

  @IsBoolean()
  @IsNotEmpty()
  storefrontEnabled: boolean;

  @IsNumber()
  @IsNotEmpty()
  deliveryFee: number;

  @IsNumber()
  @IsNotEmpty()
  collectionFee: number;

  @IsNumber()
  @IsNotEmpty()
  minimumRentalPeriod: number;
}
