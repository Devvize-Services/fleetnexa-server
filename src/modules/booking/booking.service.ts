import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingRepository } from './booking.repository.js';
import { RentalStatus, Tenant, User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailService } from '../../common/email/email.service.js';
import { ActionBookingDto } from './dto/action-booking.dto.js';
import { SendWhatsAppDto } from '../../common/notify/dto/send-whatsapp.dto.js';
import { WhatsappService } from '../../common/whatsapp/whatsapp.service.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';
import { SendDocumentsDto } from './dto/send-documents.dto.js';
import { CustomerRepository } from '../customer/customer.repository.js';
import { BookingWorkflowService } from './services/booking-workflow.service.js';
import { BookingCreationService } from './services/booking-creation.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { StorefrontUserBookingDto } from './dto/storefront-user-booking.dto.js';
import { StorefrontGuestBookingDto } from './dto/storefront-guest-booking.dto.js';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly whatsapp: WhatsappService,
    private readonly transactions: TransactionService,
    private readonly customerRepo: CustomerRepository,
    private readonly workflow: BookingWorkflowService,
    private readonly bookingCreation: BookingCreationService,
  ) {}

  private async findBookingOrFail(id: string) {
    const booking = await this.prisma.rental.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
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

  async getStorefrontBookings(id: string) {
    try {
      const user = await this.prisma.storefrontUser.findUnique({
        where: { id },
      });

      if (!user) {
        this.logger.warn(`Storefront user with ID ${id} not found`);
        throw new NotFoundException('Storefront user not found');
      }

      const customers =
        await this.customerRepo.getStorefrontBookingsByCustomerId(user.id);

      if (!customers) {
        this.logger.warn(`No storefront bookings found for user ID ${id}`);
        return [];
      }

      const customerArray = Array.isArray(customers) ? customers : [customers];
      const bookingData = customerArray.map((customer) => {
        return customer.drivers.map((driver) => {
          const rental = driver.rental;
          return {
            startDate: rental.startDate,
            endDate: rental.endDate,
            status: rental.status,
            netTotal: rental.values?.netTotal,
            id: rental.id,
            rentalNumber: rental.rentalNumber,
            bookingCode: rental.bookingCode,
            vehicle: {
              year: rental.vehicle.year,
              brand: rental.vehicle.brand.brand,
              model: rental.vehicle.model.model,
            },
            tenant: rental.vehicle.tenant
              ? {
                  tenantName: rental.vehicle.tenant.tenantName,
                  street: rental.vehicle.tenant.address?.street,
                  village: rental.vehicle.tenant.address?.village?.village,
                  state: rental.vehicle.tenant.address?.state?.state,
                  country: rental.vehicle.tenant.address?.country?.country,
                  address: rental.vehicle.tenant.address,
                  currency: rental.vehicle.tenant.currency,
                  currencyRates: rental.vehicle.tenant.currencyRates,
                }
              : null,
          };
        });
      });

      return bookingData.flat();
    } catch (error) {
      this.logger.error(error, 'Failed to get storefront bookings', {
        userId: id,
      });
      throw error;
    }
  }

  async createTenantBooking(
    data: CreateBookingDto,
    tenant: Tenant,
    user: User,
  ) {
    await this.bookingCreation.createTenantBooking(data, tenant, user);

    const bookings = await this.bookingRepo.getBookings(tenant.id);

    return {
      message: 'Booking created successfully',
      bookings,
    };
  }

  async createStorefrontUserBooking(data: StorefrontUserBookingDto) {
    return await this.bookingCreation.createUserBooking(data);
  }

  async createStorefrontGuestBooking(data: StorefrontGuestBookingDto) {
    return await this.bookingCreation.createGuestBooking(data);
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

  confirmBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    return this.workflow.confirmBooking(data, tenant, user);
  }

  declineBooking(id: string, tenant: Tenant, user: User) {
    return this.workflow.declineBooking(id, tenant, user);
  }

  cancelBooking(id: string, tenant: Tenant, user: User) {
    return this.workflow.cancelBooking(id, tenant, user);
  }

  startBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    return this.workflow.startBooking(data, tenant, user);
  }

  endBooking(data: ActionBookingDto, tenant: Tenant, user: User) {
    return this.workflow.endBooking(data, tenant, user);
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
}
