import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SwapVehicleDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsUUID()
  @IsNotEmpty()
  oldVehicleId: string;

  @IsUUID()
  @IsNotEmpty()
  newVehicleId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
