import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CustomerViolationDto {
  @IsUUID()
  id: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  violationId: string;

  @IsDateString()
  violationDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
