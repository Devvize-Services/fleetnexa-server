import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingRepository } from '../booking.repository.js';
import {
  RentalStatus,
  Tenant,
  User,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EmailService } from '../../../common/email/email.service.js';
import { ActionBookingDto } from '../dto/action-booking.dto.js';
import { VehicleStatusDto } from '../../vehicle/dto/vehicle-status.dto.js';
import { VehicleService } from '../../vehicle/vehicle.service.js';
import { DocumentService } from '../../document/document.service.js';
import { BookingActivityService } from './booking-activity.service.js';

@Injectable()
export class BookingWorkflowService {
  private readonly logger = new Logger(BookingWorkflowService.name);

  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly documentService: DocumentService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly activity: BookingActivityService,
    private readonly vehicleService: VehicleService,
  ) {}

  private async findBookingOrFail(id: string) {
    const booking = await this.prisma.rental.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateBookingStatus(
    bookingId: string,
    status: RentalStatus,
    user: User,
  ) {
    await this.findBookingOrFail(bookingId);
    await this.prisma.rental.update({
      where: { id: bookingId },
      data: { status, updatedAt: new Date(), updatedBy: user.username },
    });
  }

  async confirmBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    try {
      await this.findBookingOrFail(data.bookingId);

      await this.updateBookingStatus(
        data.bookingId,
        RentalStatus.CONFIRMED,
        user,
      );

      await this.activity.createRentalActivity(data, tenant, user, new Date());

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );

      await this.documentService.generateInvoice(
        updatedBooking?.id || '',
        tenant,
        user,
      );

      await this.documentService.generateAgreement(
        updatedBooking?.id || '',
        tenant,
        user,
      );

      if (data.sendEmail) {
        await this.emailService.sendBookingConfirmationEmail(
          updatedBooking?.id || '',
          data.includeInvoice,
          data.includeAgreement,
          tenant,
        );
      }

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: `Booking #${updatedBooking!.rentalNumber} confirmed successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to confirm booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async startBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    try {
      const booking = await this.findBookingOrFail(data.bookingId);

      await this.updateBookingStatus(data.bookingId, RentalStatus.ACTIVE, user);

      const vehicleStatus: VehicleStatusDto = {
        vehicleId: booking.vehicleId,
        status: 'RENTED',
      };

      await this.vehicleService.updateVehicleStatus(
        vehicleStatus,
        tenant,
        user,
      );

      await this.activity.createRentalActivity(data, tenant, user);

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );
      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: `Booking #${updatedBooking!.rentalNumber} started successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to start booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async endBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    try {
      const booking = await this.findBookingOrFail(data.bookingId);

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );

      await this.updateBookingStatus(data.bookingId, data.status, user);

      const vehicleStatus: VehicleStatusDto = {
        vehicleId: booking.vehicleId,
        status: 'PENDING INSPECTION',
      };

      await this.vehicleService.updateVehicleStatus(
        vehicleStatus,
        tenant,
        user,
      );

      await this.activity.createRentalActivity(
        data,
        tenant,
        user,
        data.returnDate ? new Date(data.returnDate) : undefined,
      );

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: `Booking #${updatedBooking!.rentalNumber} ended successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to end booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async declineBooking(id: string, tenant: Tenant, user: User) {
    try {
      await this.findBookingOrFail(id);

      const updatedBooking = await this.prisma.$transaction(async (tx) => {
        await this.updateBookingStatus(id, RentalStatus.DECLINED, user);

        return this.bookingRepo.getBookingById(id);
      });

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: `Booking #${updatedBooking!.rentalNumber} declined successfully`,
        updatedBooking,
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to decline booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        bookingId: id,
      });
      throw error;
    }
  }

  async cancelBooking(id: string, tenant: Tenant, user: User) {
    await this.findBookingOrFail(id);

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      await this.updateBookingStatus(id, RentalStatus.CANCELED, user);

      return this.bookingRepo.getBookingById(id);
    });

    const bookings = await this.bookingRepo.getBookings(tenant.id);

    return {
      message: `Booking #${updatedBooking!.rentalNumber} canceled successfully`,
      booking: updatedBooking,
      bookings,
    };
  }
}
