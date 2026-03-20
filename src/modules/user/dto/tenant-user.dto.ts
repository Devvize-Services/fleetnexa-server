import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class TenantUserDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  profilePicture?: string;
}
