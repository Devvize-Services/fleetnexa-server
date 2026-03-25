import { Agent } from 'src/generated/prisma/client.js';
import { BookingDriverDto, BookingValuesDto } from './booking-items.dto.js';
import { StorefrontCustomerDto } from 'src/modules/customer/storefront-customer/storefront-customer.dto.js';

export enum BookingSource {
  TENANT = 'TENANT',
  STOREFRONT_USER = 'STOREFRONT_USER',
  STOREFRONT_GUEST = 'STOREFRONT_GUEST',
}

export class CreateBookingInput {
  source: BookingSource;

  tenantId: string;

  startDate: string;
  endDate: string;

  pickupLocationId: string;
  returnLocationId: string;
  vehicleId: string;

  chargeTypeId?: string;
  agent?: Agent;
  notes?: string;

  drivers?: BookingDriverDto[];
  customer?: StorefrontCustomerDto;

  userId?: string;

  values: BookingValuesDto;

  createdBy?: string;
}
