import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class TenantLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
