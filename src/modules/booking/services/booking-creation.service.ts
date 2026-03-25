import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto.js';
import {
  Agent,
  Rental,
  RentalStatus,
  StorefrontUser,
  Tenant,
  User,
} from '../../../generated/prisma/client.js';
import {
  BookingSource,
  CreateBookingInput,
} from '../dto/create-booking-input.dto.js';
import { StorefrontUserBookingDto } from '../dto/storefront-user-booking.dto.js';
import { StorefrontGuestBookingDto } from '../dto/storefront-guest-booking.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CustomerService } from '../../../modules/customer/customer.service.js';
import { GeneratorService } from '../../../common/generator/generator.service.js';
import { StorefrontCustomerDto } from '../../../modules/customer/storefront-customer/storefront-customer.dto.js';
import { BookingDriverDto } from '../dto/booking-items.dto.js';
import { BookingRepository } from '../booking.repository.js';
import { EmailService } from '../../../common/email/email.service.js';
import { WhatsappService } from '../../../common/whatsapp/whatsapp.service.js';
import { TenantNotificationService } from '../../../modules/tenant/tenant-notification/tenant-notification.service.js';

@Injectable()
export class BookingCreationService {
  private readonly logger = new Logger(BookingCreationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
    private readonly generator: GeneratorService,
    private readonly bookingRepo: BookingRepository,
    private readonly emailService: EmailService,
    private readonly whatsapp: WhatsappService,
    private readonly tenantNotification: TenantNotificationService,
  ) {}

  createTenantBooking(dto: CreateBookingDto, tenant: Tenant, user: User) {
    const input: CreateBookingInput = {
      source: BookingSource.TENANT,
      tenantId: tenant.id,
      startDate: dto.startDate,
      endDate: dto.endDate,
      pickupLocationId: dto.pickupLocationId,
      returnLocationId: dto.returnLocationId,
      vehicleId: dto.vehicleId,
      chargeTypeId: dto.chargeTypeId,
      agent: dto.agent,
      notes: dto.notes,
      drivers: dto.drivers,
      values: dto.values,
      createdBy: user.id,
    };

    return this.createBooking(input);
  }

  createUserBooking(dto: StorefrontUserBookingDto) {
    const input: CreateBookingInput = {
      source: BookingSource.STOREFRONT_USER,
      tenantId: dto.tenantId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      pickupLocationId: dto.pickupLocationId,
      returnLocationId: dto.returnLocationId,
      vehicleId: dto.vehicleId,
      userId: dto.userId,
      values: dto.values,
    };

    return this.createBooking(input);
  }

  createGuestBooking(dto: StorefrontGuestBookingDto) {
    const input: CreateBookingInput = {
      source: BookingSource.STOREFRONT_GUEST,
      tenantId: dto.tenantId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      pickupLocationId: dto.pickupLocationId,
      returnLocationId: dto.returnLocationId,
      vehicleId: dto.vehicleId,
      customer: dto.customer,
      values: dto.values,
    };

    return this.createBooking(input);
  }

  async createBooking(data: CreateBookingInput) {
    const tenant = await this.getTenantById(data.tenantId);
    const identifiers = await this.generateIdentifiers(tenant);

    const booking = await this.prisma.rental.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        pickupLocationId: data.pickupLocationId,
        returnLocationId: data.returnLocationId,
        vehicleId: data.vehicleId,
        chargeTypeId: data.chargeTypeId,
        bookingCode: identifiers.bookingCode,
        createdAt: new Date(),
        createdBy: data.createdBy,
        rentalNumber: identifiers.bookingNumber,
        tenantId: tenant.id,
        status: RentalStatus.PENDING,
        agent: data.agent ?? Agent.SYSTEM,
      },
    });

    await this.assignDrivers(data, booking, tenant);

    await this.bookingRepo.createBookingValues(booking.id, data.values);

    if (data.source !== BookingSource.TENANT) {
      await this.sendNotifications(booking);
      return this.getBookingDetails(booking.id);
    }

    return booking;
  }

  private async getTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  private async assignDrivers(
    data: CreateBookingInput,
    booking: Rental,
    tenant: Tenant,
  ) {
    switch (data.source) {
      case BookingSource.TENANT:
        return this.assignDriversToBooking(data.drivers, booking);
      case BookingSource.STOREFRONT_USER:
        return this.assignUserToBooking(data.userId!, booking.id, tenant);
      case BookingSource.STOREFRONT_GUEST:
        return this.assignGuestToBooking(data.customer, booking.id, tenant);
    }
  }

  async assignDriversToBooking(
    drivers: BookingDriverDto[] | undefined,
    booking: Rental,
  ) {
    if (!drivers) return;

    return await Promise.all(
      drivers.map((driver: any) =>
        this.prisma.rentalDriver.create({
          data: {
            id: driver.id,
            driverId: driver.driverId,
            isPrimary: driver.isPrimary,
            rentalId: booking.id,
          },
        }),
      ),
    );
  }

  async assignUserToBooking(userId: string, bookingId: string, tenant: Tenant) {
    const user = await this.getStorefrontUser(userId);
    const customerDto = await this.createCustomer(user);

    const storefrontCustomer = await this.customerService.getStorefrontCustomer(
      customerDto,
      tenant,
    );

    await this.prisma.rentalDriver.create({
      data: {
        driverId: storefrontCustomer.id,
        rentalId: bookingId,
        isPrimary: true,
      },
    });
  }

  async assignGuestToBooking(
    data: StorefrontCustomerDto | undefined,
    bookingId: string,
    tenant: Tenant,
  ) {
    if (!data) return;

    const storefrontCustomer = await this.customerService.getStorefrontCustomer(
      data,
      tenant,
    );

    await this.prisma.rentalDriver.create({
      data: {
        driverId: storefrontCustomer.id,
        rentalId: bookingId,
        isPrimary: true,
      },
    });
  }

  private async generateIdentifiers(tenant: Tenant) {
    const bookingNumber = await this.generator.generateBookingNumber(tenant.id);
    if (!bookingNumber) throw new Error('Failed to generate booking number');

    const bookingCode = await this.generator.generateBookingCode(
      tenant.tenantCode,
      bookingNumber,
    );
    if (!bookingCode) throw new Error('Failed to generate booking code');

    return { bookingNumber, bookingCode };
  }

  private async getStorefrontUser(userId: string) {
    const user = await this.prisma.storefrontUser.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Storefront user not found');
    return user;
  }

  private async createCustomer(
    user: StorefrontUser,
  ): Promise<StorefrontCustomerDto> {
    try {
      const customer: StorefrontCustomerDto = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        gender: user.gender,
        phone: user.phone,
        driverLicenseNumber: user.driverLicenseNumber,
        licenseExpiry: user.licenseExpiry?.toISOString() || '',
        licenseIssued: user.licenseIssued?.toISOString() || '',
        dateOfBirth: user.dateOfBirth?.toISOString() || '',
        license: user.license || '',
        storefrontId: user.id || '',
      };

      return customer;
    } catch (error) {
      this.logger.error(error, 'Failed to create storefront customer', {
        userId: user.id,
      });
      throw new Error('Failed to create storefront customer');
    }
  }

  private async sendNotifications(booking: any) {
    const tasks = [
      this.emailService.sendBookingCompletedEmail(booking.id, booking.tenant),
      this.emailService.sendNewBookingEmail(booking.id, booking.tenant),
      this.whatsapp.sendBookingNotification(booking.id),
      this.tenantNotification.sendBookingNotification(
        booking.id,
        booking.tenant,
      ),
    ];

    const results = await Promise.allSettled(tasks);

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error(
          r.reason,
          `Notification #${i + 1} failed unexpectedly`,
          {
            bookingId: booking.id,
          },
        );
      }
    });
  }

  private async getBookingDetails(bookingId: string) {
    return this.prisma.rental.findUnique({
      where: { id: bookingId },
      select: {
        startDate: true,
        endDate: true,
        id: true,
        rentalNumber: true,
        bookingCode: true,
        tenant: {
          select: {
            id: true,
            tenantName: true,
            email: true,
            number: true,
            currency: true,
            currencyRates: {
              include: {
                currency: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            year: true,
            brand: true,
            model: true,
            tenant: { select: { currency: true } },
          },
        },
        pickup: true,
        values: { select: { netTotal: true } },
      },
    });
  }
}
