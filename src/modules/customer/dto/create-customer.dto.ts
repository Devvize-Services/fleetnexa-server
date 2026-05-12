import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CustomerStatus } from '../../../generated/prisma/enums.js';

export class CustomerDriversLicenseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  customerId: string;

  @IsString()
  licenseNumber: string;

  @IsString()
  licenseIssued: string;

  @IsString()
  licenseExpiry: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class CustomerAddressDto {
  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  villageId?: string;

  @IsString()
  @IsOptional()
  stateId?: string;

  @IsString()
  @IsOptional()
  countryId?: string;
}

export class CreateCustomerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  gender: string;

  @IsString()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsEnum(CustomerStatus)
  status: CustomerStatus;

  @IsOptional()
  address?: CustomerAddressDto;

  @IsObject()
  license: CustomerDriversLicenseDto;
}
