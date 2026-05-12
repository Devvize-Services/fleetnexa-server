import { IsNumber, IsString } from 'class-validator';

export class RateTenantDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  fullName: string;

  @IsNumber()
  rating: number;

  @IsString()
  tenantId: string;

  @IsString()
  comment: string;
}
