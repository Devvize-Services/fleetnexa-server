import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsEnum,
  Max,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsObject,
  IsOptional,
} from 'class-validator';
import {
  BookingDriverDto,
  BookingValuesDto,
} from '../dto/booking-items.dto.js';
import { Agent, RentalStatus } from '../../../generated/prisma/client.js';

export class UpdateBookingDto {
  @IsUUID()
  id: string;

  @IsString()
  bookingCode: string;

  @IsString()
  startDate: string;

  @IsString()
  rentalNumber: string;

  @IsEnum(RentalStatus)
  status: RentalStatus;

  @IsString()
  endDate: string;

  @IsUUID()
  pickupLocationId: string;

  @IsUUID()
  returnLocationId: string;

  @IsUUID()
  vehicleId: string;

  @IsUUID()
  chargeTypeId: string;

  @IsEnum(Agent)
  agent: Agent;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingDriverDto)
  drivers: BookingDriverDto[];

  @IsObject()
  values: BookingValuesDto;
}
