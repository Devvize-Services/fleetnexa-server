import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingRepository } from './booking.repository.js';
import {
  Agent,
  RentalStatus,
  Tenant,
  User,
  VehicleEventType,
} from '../../generated/prisma/client.js';
import { GeneratorService } from '../../common/generator/generator.service.js';
import { VehicleEventDto } from '../vehicle/dto/vehicle-event.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { VehicleEventService } from '../vehicle/modules/vehicle-event/vehicle-event.service.js';
import { EmailService } from '../../common/email/email.service.js';
import { ActionBookingDto } from './dto/action-booking.dto.js';
import { RentalActivityDto } from './dto/rental-activity.dto.js';
import { CustomerService } from '../customer/customer.service.js';
import { VehicleStatusDto } from '../vehicle/dto/vehicle-status.dto.js';
import { VehicleService } from '../vehicle/vehicle.service.js';
import { SendWhatsAppDto } from '../../common/notify/dto/send-whatsapp.dto.js';
import { WhatsappService } from '../../common/whatsapp/whatsapp.service.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { DocumentService } from '../document/document.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';
import { SendDocumentsDto } from './dto/send-documents.dto.js';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly generator: GeneratorService,
    private readonly prisma: PrismaService,
    private readonly vehicleEvent: VehicleEventService,
    private readonly documentService: DocumentService,
    private readonly emailService: EmailService,
    private readonly customerService: CustomerService,
    private readonly vehicleService: VehicleService,
    private readonly whatsapp: WhatsappService,
    private readonly transactions: TransactionService,
  ) {}

  private async findBookingOrFail(id: string) {
    const booking = await this.prisma.rental.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  private async bookingResponse(
    message: string,
    bookingId: string,
    tenantId: string,
  ) {
    const [booking, bookings] = await Promise.all([
      this.bookingRepo.getBookingById(bookingId),
      this.bookingRepo.getBookings(tenantId),
    ]);
    return { message, booking, bookings };
  }

  getBookings(tenant: Tenant) {
    return this.bookingRepo.getBookings(tenant.id);
  }

  async getBookingByCode(bookingCode: string) {
    const booking = await this.bookingRepo.getBookingByCode(bookingCode);
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getBookingById(bookingId: string) {
    const booking = await this.bookingRepo.getBookingById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async createTenantBooking(
    data: CreateBookingDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const bookingNumber = await this.generator.generateBookingNumber(
        tenant.id,
      );

      if (!bookingNumber) {
        throw new NotFoundException('Failed to generate booking number');
      }

      const bookingCode = await this.generator.generateBookingCode(
        tenant.tenantCode,
        bookingNumber,
      );

      if (!bookingCode) {
        throw new NotFoundException('Failed to generate booking code');
      }

      const newBooking = await this.prisma.$transaction(async (tx) => {
        const newBooking = await tx.rental.create({
          data: {
            id: data.id,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            pickupLocationId: data.pickupLocationId,
            returnLocationId: data.returnLocationId,
            vehicleId: data.vehicleId,
            chargeTypeId: data.chargeTypeId,
            bookingCode,
            createdAt: new Date(),
            createdBy: user.id,
            rentalNumber: bookingNumber,
            tenantId: tenant.id,
            status: RentalStatus.PENDING,
            agent: data.agent ?? Agent.SYSTEM,
          },
        });

        await Promise.all(
          data.drivers.map((driver: any) =>
            tx.rentalDriver.create({
              data: {
                id: driver.id,
                driverId: driver.driverId,
                isPrimary: driver.isPrimary,
                rentalId: newBooking.id,
              },
            }),
          ),
        );

        await this.bookingRepo.createBookingValues(
          newBooking.id,
          data.values,
          tx,
        );

        return newBooking;
      });

      const booking = await this.bookingRepo.getBookingById(newBooking.id);
      const bookings = await this.bookingRepo.getBookings(tenant.id);

      const vehicleEvent: VehicleEventDto = {
        vehicleId: booking!.vehicleId,
        event: `Vehicle rented for booking #${booking!.rentalNumber}`,
        type: VehicleEventType.ASSIGNED_TO_BOOKING,
        date: new Date().toISOString(),
        notes: `Booking #${booking!.rentalNumber} created by ${user.username}`,
      };

      await this.vehicleEvent.createEvent(vehicleEvent);

      return { message: 'Booking created successfully', booking, bookings };
    } catch (error) {
      this.logger.error(error, 'Failed to create booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateBooking(data: UpdateBookingDto, tenant: Tenant, user: User) {
    await this.findBookingOrFail(data.id);

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.rental.update({
        where: { id: data.id },
        data: {
          id: data.id,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          pickupLocationId: data.pickupLocationId,
          returnLocationId: data.returnLocationId,
          vehicleId: data.vehicleId,
          chargeTypeId: data.chargeTypeId,
          status: data.status ?? RentalStatus.PENDING,
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      });

      await tx.rentalDriver.deleteMany({
        where: { rentalId: data.id },
      });

      await Promise.all(
        data.drivers.map((driver: any) =>
          tx.rentalDriver.create({
            data: {
              id: driver.id,
              driverId: driver.driverId,
              isPrimary: driver.isPrimary,
              rentalId: updatedBooking.id,
            },
          }),
        ),
      );

      await this.bookingRepo.updateBookingValues(
        updatedBooking.id,
        data.values,
      );

      return updatedBooking;
    });

    const updated = await this.bookingRepo.getBookingById(updatedBooking.id);
    const bookings = await this.bookingRepo.getBookings(tenant.id);

    return {
      message: 'Booking updated successfully',
      booking: updated,
      bookings,
    };
  }

  async confirmBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    try {
      await this.findBookingOrFail(data.bookingId);

      await this.updateBookingStatus(
        data.bookingId,
        RentalStatus.CONFIRMED,
        tenant,
        user,
      );

      await this.createRentalActivity(data, tenant, user, new Date());

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

  async declineBooking(id: string, tenant: Tenant, user: User) {
    try {
      await this.findBookingOrFail(id);

      const updatedBooking = await this.prisma.$transaction(async (tx) => {
        await this.updateBookingStatus(id, RentalStatus.DECLINED, tenant, user);

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
      await this.updateBookingStatus(id, RentalStatus.CANCELED, tenant, user);

      return this.bookingRepo.getBookingById(id);
    });

    const bookings = await this.bookingRepo.getBookings(tenant.id);

    return {
      message: `Booking #${updatedBooking!.rentalNumber} canceled successfully`,
      booking: updatedBooking,
      bookings,
    };
  }

  async startBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    const booking = await this.findBookingOrFail(data.bookingId);

    await this.updateBookingStatus(
      data.bookingId,
      RentalStatus.ACTIVE,
      tenant,
      user,
    );

    const vehicleStatus: VehicleStatusDto = {
      vehicleId: booking.vehicleId,
      status: 'RENTED',
    };

    await this.vehicleService.updateVehicleStatus(vehicleStatus, tenant, user);

    await this.createRentalActivity(data, tenant, user);

    const updatedBooking = await this.bookingRepo.getBookingById(
      data.bookingId,
    );
    const bookings = await this.bookingRepo.getBookings(tenant.id);

    return {
      message: `Booking #${updatedBooking!.rentalNumber} started successfully`,
      booking: updatedBooking,
      bookings,
    };
  }

  async endBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    try {
      const booking = await this.findBookingOrFail(data.bookingId);

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );

      await this.updateBookingStatus(data.bookingId, data.status, tenant, user);

      const vehicleStatus: VehicleStatusDto = {
        vehicleId: booking.vehicleId,
        status: 'PENDING INSPECTION',
      };

      await this.vehicleService.updateVehicleStatus(
        vehicleStatus,
        tenant,
        user,
      );

      await this.createRentalActivity(
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

  async deleteBooking(id: string, tenant: Tenant, user: User) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existingRecord = await tx.rental.findUnique({
          where: { id },
        });

        if (!existingRecord) {
          this.logger.warn('Booking not found for deletion', {
            tenantId: tenant.id,
            tenantCode: tenant.tenantCode,
            bookingId: id,
          });
          throw new NotFoundException('Booking not found');
        }

        await tx.rental.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            updatedBy: user.id,
          },
        });

        await this.transactions.deleteBookingTransaction(id, tx);
      });

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: 'Booking deleted successfully',
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to delete booking', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        bookingId: id,
      });
      throw error;
    }
  }

  async sendBookingDocuments(data: SendDocumentsDto, tenant: Tenant) {
    try {
      this.logger.log(data);

      if (data.method === 'WHATSAPP') {
        const payload: SendWhatsAppDto = {
          recipient: data.recipient,
          message: `Please find your attached booking documents from ${tenant.tenantName}`,
          documents: data.documents,
        };

        await this.whatsapp.sendBookingDocuments(payload);
      } else if (data.method === 'EMAIL') {
        await this.emailService.sendBookingDocuments(data, tenant);
      }

      return { message: 'Booking documents sent successfully' };
    } catch (error) {
      this.logger.error(error, 'Failed to send booking documents', {
        data,
      });
      throw error;
    }
  }

  async getBookingsByDate(date: string, tenant: Tenant) {
    try {
      const dateObj = new Date(date);
      const startOfDay = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
      );
      const endOfDay = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate() + 1,
      );

      const bookings = await this.bookingRepo.getBookingsByDates(
        tenant.id,
        startOfDay.toISOString(),
        endOfDay.toISOString(),
      );

      return bookings;
    } catch (error) {
      this.logger.error(error, 'Failed to get bookings by date', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        date,
      });
      throw error;
    }
  }

  async updateBookingStatus(
    bookingId: string,
    status: RentalStatus,
    tenant: Tenant,
    user: User,
  ) {
    await this.findBookingOrFail(bookingId);
    await this.prisma.rental.update({
      where: { id: bookingId },
      data: { status, updatedAt: new Date(), updatedBy: user.username },
    });
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
