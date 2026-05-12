import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RentalActivityDto } from '../dto/rental-activity.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CustomerService } from '../../customer/customer.service.js';
import { Tenant, User } from '../../../generated/prisma/client.js';

@Injectable()
export class BookingActivityService {
  private readonly logger = new Logger(BookingActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
  ) {}

  private async findBookingOrFail(id: string) {
    const booking = await this.prisma.rental.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async createRentalActivity(
    data: RentalActivityDto,
    tenant: Tenant,
    user: User,
    createdAt?: Date,
  ) {
    const booking = await this.findBookingOrFail(data.bookingId);
    const primaryDriver = await this.customerService.getPrimaryDriver(
      booking.id,
    );

    if (!primaryDriver) throw new NotFoundException('Primary driver not found');

    await this.prisma.rentalActivity.create({
      data: {
        rentalId: data.bookingId,
        action: data.action,
        tenantId: tenant.id,
        createdAt:
          createdAt ??
          (new Date(booking.startDate) < new Date()
            ? new Date(booking.startDate)
            : new Date()),
        createdBy: user.username,
        customerId: primaryDriver.driverId,
        vehicleId: booking.vehicleId,
      },
    });
  }
}
