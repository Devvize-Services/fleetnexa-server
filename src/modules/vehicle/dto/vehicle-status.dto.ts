import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VehicleStatusDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
