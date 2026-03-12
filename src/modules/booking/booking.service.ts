import { Injectable, Logger } from '@nestjs/common';
import { Tenant } from 'src/generated/prisma/client';
import { BookingRepository } from './booking.repository';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly bookingRepo: BookingRepository) {}

  async getBookings(tenant: Tenant) {
    try {
      return await this.bookingRepo.getBookings(tenant.id);
    } catch (error) {
      this.logger.error(error, 'Failed to get bookings', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }
}
