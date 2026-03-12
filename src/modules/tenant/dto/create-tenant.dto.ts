import { IsEmail, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { TenantUserDto } from '../../user/tenant-user/dto/tenant-user.dto.js';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsEmail()
  @IsNotEmpty()
  companyEmail: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsObject()
  @IsNotEmpty()
  user: TenantUserDto;
}
