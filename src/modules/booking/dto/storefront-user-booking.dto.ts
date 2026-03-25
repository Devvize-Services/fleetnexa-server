import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';
import { BookingValuesDto } from './booking-items.dto.js';

export class StorefrontUserBookingDto {
  @IsUUID()
  userId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsUUID()
  pickupLocationId: string;

  @IsUUID()
  returnLocationId: string;

  @IsUUID()
  vehicleId: string;

  @IsUUID()
  tenantId: string;

  @IsObject()
  @IsNotEmpty()
  values: BookingValuesDto;
}
