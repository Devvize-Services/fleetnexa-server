import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VehicleLocationDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsNotEmpty()
  locationId: string;
}
