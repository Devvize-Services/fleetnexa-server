import { Injectable, Logger } from '@nestjs/common';
import { BookingRepository } from './booking.repository.js';
import { Tenant } from 'src/generated/prisma/client.js';

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
