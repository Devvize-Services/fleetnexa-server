import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
} from 'class-validator';
import { BookingValuesDto } from './booking-items.dto.js';
import { StorefrontCustomerDto } from '../../customer/storefront-customer/storefront-customer.dto.js';

export class StorefrontGuestBookingDto {
  @IsObject()
  @IsNotEmpty()
  customer: StorefrontCustomerDto;

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
