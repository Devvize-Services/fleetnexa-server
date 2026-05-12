import { IsEmail, IsOptional, IsString } from 'class-validator';

class StorefrontCustomerAddressDto {
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

export class StorefrontCustomerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  driverLicenseNumber: string;

  @IsString()
  licenseExpiry: string;

  @IsString()
  licenseIssued: string;

  @IsString()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  license?: string;

  @IsOptional()
  address?: StorefrontCustomerAddressDto;

  @IsOptional()
  storefrontId?: string;
}
