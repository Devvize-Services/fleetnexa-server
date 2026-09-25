import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActivityService } from '../../../common/activity/activity.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ResendService } from '../../../infrastructure/resend/resend.service';
import { DocumentService } from '../../../modules/document/document.service';
import { InvoiceService } from '../../../modules/finance/invoice/invoice.service';
import { VehicleService } from '../../../modules/vehicle/vehicle.service';
import { BookingRepository } from '../booking.repository';
import { BookingActivityService } from '../services/booking-activity.service';
import { RentalStatus, Tenant, User } from '../../../generated/prisma/client';
import { ActionBookingDto } from './action-booking.dto';
import { VehicleStatusDto } from '../../../modules/vehicle/dto/vehicle-status.dto';

@Injectable()
export class BookingActionService {
  private readonly logger = new Logger(BookingActionService.name);
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly documentService: DocumentService,
    private readonly prisma: PrismaService,
    private readonly activity: BookingActivityService,
    private readonly vehicleService: VehicleService,
    private readonly resend: ResendService,
    private readonly invoiceService: InvoiceService,
    private readonly activityService: ActivityService,
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

  async confirmBooking(
    data: ActionBookingDto,
    tenant: Tenant,
    user: User,
    res?: any,
  ) {
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

      await this.invoiceService.generateInvoice(
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
        await this.resend.sendBookingConfirmationEmail(
          updatedBooking?.id || '',
          data.includeInvoice,
          data.includeAgreement,
          tenant,
        );
      }

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      await this.activityService.logEvent({
        userId: user.id,
        tenantId: tenant.id,
        action: 'CONFIRM',
        module: 'BOOKING',
        entityType: 'BOOKING',
        entityId: updatedBooking?.id || '',
        description: `Booking #${updatedBooking?.rentalNumber} has been confirmed`,
        ipAddress: res?.ip || '',
        userAgent: res?.headers['user-agent'] || '',
      });

      return {
        message: `Booking #${updatedBooking!.rentalNumber} confirmed successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to confirm booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async startBooking(
    data: ActionBookingDto,
    tenant: Tenant,
    user: User,
    res?: any,
  ) {
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

      await this.activityService.logEvent({
        userId: user.id,
        tenantId: tenant.id,
        action: 'START',
        module: 'BOOKING',
        entityType: 'BOOKING',
        entityId: updatedBooking?.id || '',
        description: `Booking #${updatedBooking?.rentalNumber} has been started`,
        ipAddress: res?.ip || '',
        userAgent: res?.headers['user-agent'] || '',
      });

      return {
        message: `Booking #${updatedBooking!.rentalNumber} started successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to start booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async endBooking(
    data: ActionBookingDto,
    tenant: Tenant,
    user: User,
    res?: any,
  ) {
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

      await this.activityService.logEvent({
        userId: user.id,
        tenantId: tenant.id,
        action: 'END',
        module: 'BOOKING',
        entityType: 'BOOKING',
        entityId: updatedBooking?.id || '',
        description: `Booking #${updatedBooking?.rentalNumber} has been ended`,
        ipAddress: res?.ip || '',
        userAgent: res?.headers['user-agent'] || '',
      });

      return {
        message: `Booking #${updatedBooking!.rentalNumber} ended successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to end booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async declineBooking(id: string, tenant: Tenant, user: User, res?: any) {
    try {
      await this.findBookingOrFail(id);

      const updatedBooking = await this.prisma.$transaction(async (tx) => {
        await this.updateBookingStatus(id, RentalStatus.DECLINED, user);

        return this.bookingRepo.getBookingById(id);
      });

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      await this.activityService.logEvent({
        userId: user.id,
        tenantId: tenant.id,
        action: 'DECLINE',
        module: 'BOOKING',
        entityType: 'BOOKING',
        entityId: updatedBooking?.id || '',
        description: `Booking #${updatedBooking?.rentalNumber} has been declined`,
        ipAddress: res?.ip || '',
        userAgent: res?.headers['user-agent'] || '',
      });

      return {
        message: `Booking #${updatedBooking!.rentalNumber} declined successfully`,
        updatedBooking,
        bookings,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to decline booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        bookingId: id,
      });
      throw error;
    }
  }

  async cancelBooking(id: string, tenant: Tenant, user: User, res?: any) {
    try {
      await this.findBookingOrFail(id);

      const updatedBooking = await this.prisma.$transaction(async (tx) => {
        await this.updateBookingStatus(id, RentalStatus.CANCELED, user);

        return this.bookingRepo.getBookingById(id);
      });

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      await this.activityService.logEvent({
        userId: user.id,
        tenantId: tenant.id,
        action: 'CANCEL',
        module: 'BOOKING',
        entityType: 'BOOKING',
        entityId: updatedBooking?.id || '',
        description: `Booking #${updatedBooking?.rentalNumber} has been canceled`,
        ipAddress: res?.ip || '',
        userAgent: res?.headers['user-agent'] || '',
      });

      return {
        message: `Booking #${updatedBooking!.rentalNumber} canceled successfully`,
        booking: updatedBooking,
        bookings,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to cancel booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        bookingId: id,
      });
      throw error;
    }
  }
}
