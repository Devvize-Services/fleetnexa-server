import { Global, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotifyService } from '../notify/notify.service.js';
import {
  Tenant,
  User,
  UserRole,
  UserType,
} from '../../generated/prisma/client.js';
import { FormatterService } from '../formatter/formatter.service.js';
import { SendEmailDto } from '../notify/dto/send-email.dto.js';
import { CustomerService } from '../../modules/customer/customer.service.js';
import {
  BookingCompletedEmailDto,
  BookingConfirmationEmailDto,
  BookingDeclinedEmailDto,
  BookingDocumentsEmailDto,
  NewBookingEmailDto,
  NewUserEmailDto,
  PasswordResetEmailDto,
  VerificationEmailDto,
  WelcomeEmailDto,
} from '../../types/email.js';
import { SendDocumentsDto } from 'src/modules/booking/dto/send-documents.dto.js';

@Global()
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
    private readonly formatter: FormatterService,
    private readonly customerService: CustomerService,
  ) {}

  async sendBookingConfirmationEmail(
    bookingId: string,
    includeInvoice: boolean,
    includeAgreement: boolean,
    tenant: Tenant,
  ) {
    try {
      let currency;

      if (!tenant.currencyId) {
        currency = await this.prisma.currency.findFirst({
          where: { code: 'USD' },
        });
      } else {
        currency = await this.prisma.currency.findUnique({
          where: { id: tenant.currencyId },
        });
      }

      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
        include: {
          pickup: true,
          vehicle: {
            include: {
              brand: true,
              model: {
                include: {
                  bodyType: true,
                },
              },
              transmission: true,
            },
          },
          invoice: true,
          agreement: true,
          values: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const primaryDriver = await this.customerService.getPrimaryDriver(
        booking.id,
      );

      const templateData: BookingConfirmationEmailDto = {
        bookingId: booking?.bookingCode || '',
        startDate:
          this.formatter.formatDateToFriendlyDate(booking?.startDate) || '',
        pickupTime:
          this.formatter.formatDateToFriendlyTime(booking?.startDate) || '',
        endDate:
          this.formatter.formatDateToFriendlyDate(booking?.endDate) || '',
        pickupLocation: booking?.pickup.location || '',
        totalPrice: this.formatter.formatNumberToTenantCurrency(
          booking?.values?.netTotal || 0,
          currency?.code || 'USD',
        ),
        tenantName: tenant?.tenantName || '',
        phone: tenant?.number || '',
        vehicle: this.formatter.formatVehicleToFriendly(booking?.vehicle) || '',
        email: tenant?.email || '',
        invoiceUrl: includeInvoice
          ? booking?.invoice?.invoiceUrl || ''
          : undefined,
        agreementUrl: includeAgreement
          ? booking?.agreement?.agreementUrl || ''
          : undefined,
      };

      const payload: SendEmailDto = {
        recipients: [primaryDriver?.customer.email || ''],
        cc: [],
        templateName: 'FleetNexaBookingConfirmation',
        templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error('Error sending booking confirmation email', error);
      throw error;
    }
  }

  async sendBookingDeclinedEmail(
    bookingId: string,
    tenant: Tenant,
    declineReason?: string,
  ) {
    try {
      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            include: {
              brand: true,
              model: {
                include: {
                  bodyType: true,
                },
              },
              transmission: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const primaryDriver = await this.customerService.getPrimaryDriver(
        booking.id,
      );

      const templateData: BookingDeclinedEmailDto = {
        bookingId: booking?.bookingCode || '',
        startDate:
          this.formatter.formatDateToFriendlyDate(booking?.startDate) || '',
        endDate:
          this.formatter.formatDateToFriendlyDate(booking?.endDate) || '',
        tenantName: tenant?.tenantName || '',
        vehicle: this.formatter.formatVehicleToFriendly(booking?.vehicle) || '',
        declineReason: declineReason || undefined,
      };

      const payload: SendEmailDto = {
        recipients: [primaryDriver?.customer.email || ''],
        cc: [],
        templateName: 'FleetNexaBookingDeclined',
        templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error('Error sending booking confirmation email', error);
      throw error;
    }
  }

  async sendBookingCompletedEmail(bookingId: string, tenant: Tenant) {
    try {
      this.logger.log(
        `Sending booking completed email for booking ID: ${bookingId} and tenant ID: ${tenant.id}`,
      );

      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId, tenantId: tenant.id },
        include: {
          values: true,
          pickup: true,
          vehicle: {
            include: {
              brand: true,
              model: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      let currency;

      if (!tenant.currencyId) {
        currency = await this.prisma.currency.findFirst({
          where: { code: 'USD' },
        });
      } else {
        currency = await this.prisma.currency.findUnique({
          where: { id: tenant.currencyId },
        });
      }

      const primaryDriver = await this.customerService.getPrimaryDriver(
        booking.id,
      );

      const templateData: BookingCompletedEmailDto = {
        bookingId: booking?.bookingCode || '',
        startDate:
          this.formatter.formatDateToFriendlyDate(booking?.startDate) || '',
        pickupTime:
          this.formatter.formatDateToFriendlyTime(booking?.startDate) || '',
        endDate:
          this.formatter.formatDateToFriendlyDate(booking?.endDate) || '',
        pickupLocation: booking?.pickup.location || '',
        totalPrice: this.formatter.formatNumberToTenantCurrency(
          booking?.values?.netTotal || 0,
          currency?.code || 'USD',
        ),
        tenantName: tenant?.tenantName || '',
        phone: tenant?.number || '',
        vehicle: this.formatter.formatVehicleToFriendly(booking?.vehicle) || '',
        email: tenant?.email || '',
      };

      const payload: SendEmailDto = {
        recipients: [primaryDriver?.customer.email || ''],
        cc: [],
        templateName: 'RentNexaBookingSubmitted',
        templateData,
        sender: 'no-reply@rentnexa.com',
        senderName: 'RentNexa',
      };

      const res = await this.notify.sendEmail(payload);
      this.logger.log(`Booking completed email sent: ${res}`);
    } catch (error) {
      this.logger.error('Error sending new booking email', error);
      throw error;
    }
  }

  async sendNewBookingEmail(bookingId: string, tenant: Tenant) {
    try {
      this.logger.log(
        `Sending new booking email for booking ID: ${bookingId} and tenant ID: ${tenant.id}`,
      );
      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId, tenantId: tenant.id },
        include: {
          values: true,
          pickup: true,
          return: true,
          tenant: true,
          vehicle: {
            include: {
              brand: true,
              model: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      let currency;

      if (!tenant.currencyId) {
        currency = await this.prisma.currency.findFirst({
          where: { code: 'USD' },
        });
      } else {
        currency = await this.prisma.currency.findUnique({
          where: { id: tenant.currencyId },
        });
      }

      const primaryDriver = await this.customerService.getPrimaryDriver(
        booking.id,
      );

      const customerAddress = primaryDriver?.customer.address?.street || '';

      const templateData: NewBookingEmailDto = {
        bookingId: booking.bookingCode || '',
        bookingStatus: booking.status || '',
        bookingDate: this.formatter.formatDateToFriendlyDate(booking.createdAt),
        vehicle: this.formatter.formatVehicleToFriendly(booking?.vehicle),
        totalPrice: this.formatter.formatNumberToTenantCurrency(
          booking?.values?.netTotal || 0,
          currency?.code || 'USD',
        ),
        customerName: `${primaryDriver?.customer.firstName || ''} ${
          primaryDriver?.customer.lastName || ''
        }`,
        customerEmail: primaryDriver?.customer.email || '',
        customerPhone: primaryDriver?.customer.phone || '',
        driverLicense: primaryDriver?.customer.license?.licenseNumber || '',
        customerAddress: customerAddress,
        startDate: this.formatter.formatDateToFriendlyDate(booking?.startDate),
        endDate:
          this.formatter.formatDateToFriendlyDate(booking?.endDate) || '',
        pickupLocation: booking?.pickup.location || '',
        pickupTime:
          this.formatter.formatDateToFriendlyTime(booking?.startDate) || '',
        returnTime:
          this.formatter.formatDateToFriendlyTime(booking?.endDate) || '',
        returnLocation: booking?.return.location || '',
        rentalDuration: `${booking.values?.numberOfDays} day(s)`,
        vehiclePrice: this.formatter.formatNumberToTenantCurrency(
          booking.values?.totalCost || 0,
          currency?.code || 'USD',
        ),
        additionsTotal: this.formatter.formatNumberToTenantCurrency(
          booking.values?.totalExtras || 0,
          currency?.code || 'USD',
        ),
        securityDeposit: this.formatter.formatNumberToTenantCurrency(
          booking.values?.deposit || 0,
          currency?.code || 'USD',
        ),
      };

      const payload: SendEmailDto = {
        recipients: [tenant.email || ''],
        cc: [],
        templateName: 'RentNexaNewBooking',
        templateData,
        sender: 'no-reply@rentnexa.com',
        senderName: 'RentNexa',
      };

      const res = await this.notify.sendEmail(payload);
      this.logger.log(`Booking completed email sent: ${res}`);
    } catch (error) {
      this.logger.error('Error sending booking completed email', error);
      throw error;
    }
  }

  async sendStorefrontPasswordResetEmail(token: string, email: string) {
    try {
      const templateData: PasswordResetEmailDto = {
        verificationCode: token,
      };

      const payload: SendEmailDto = {
        recipients: [email],
        cc: [],
        templateName: 'RentNexaPasswordReset',
        templateData,
        sender: 'no-reply@rentnexa.com',
        senderName: 'RentNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error('Error sending storefront password reset email', error);
      throw error;
    }
  }

  async sendBookingDocuments(data: SendDocumentsDto, tenant: Tenant) {
    try {
      const booking = await this.prisma.rental.findUnique({
        where: { id: data.bookingId },
        include: {
          pickup: true,
          vehicle: {
            include: {
              brand: true,
              model: {
                include: {
                  bodyType: true,
                },
              },
              transmission: true,
            },
          },
          invoice: true,
          agreement: true,
          values: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const currency = await this.prisma.currency.findUnique({
        where: { id: tenant.currencyId! },
      });

      const templateData: BookingDocumentsEmailDto = {
        bookingId: booking.bookingCode || '',
        startDate: this.formatter.formatDateToFriendlyDate(booking.startDate),
        endDate: this.formatter.formatDateToFriendlyDate(booking.endDate),
        pickupTime: this.formatter.formatDateToFriendlyTime(booking.startDate),
        pickupLocation: booking.pickup.location,
        totalPrice: this.formatter.formatNumberToTenantCurrency(
          booking.values?.amountDue || 0,
          currency?.code || 'USD',
        ),
        tenantName: tenant.tenantName || '',
        phone: tenant.number || '',
        vehicle: this.formatter.formatVehicleToFriendly(booking.vehicle),
        email: tenant.email || '',
        documents: data.documents || [],
      };

      const payload: SendEmailDto = {
        recipients: [data.recipient],
        cc: [],
        templateName: 'FleetNexaBookingDocuments',
        templateData: templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error('Error sending booking documents email', error);
      throw error;
    }
  }

  async sendNewUserWelcomeEmail(
    userId: string,
    password: string,
    tenant: Tenant,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, tenantId: tenant.id },
      });

      if (!user) {
        this.logger.warn(
          `User with ID ${userId} not found for tenant ${tenant.id}`,
        );
        throw new NotFoundException('User not found');
      }

      const templateData: NewUserEmailDto = {
        tenantName: tenant?.tenantName,
        name: `${user?.firstName} ${user?.lastName}`,
        username: user?.username,
        password,
      };

      const payload: SendEmailDto = {
        recipients: [user.email || ''],
        cc: [],
        templateName: 'FleetNexaNewUser',
        templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error(error, 'Error sending new user welcome email', {
        userId,
        tenantId: tenant.id,
      });
      throw error;
    }
  }

  async sendUserPasswordResetNotification(
    userId: string,
    password: string,
    tenant: Tenant,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, tenantId: tenant.id },
      });

      if (!user) {
        this.logger.warn(
          `User with ID ${userId} not found for tenant ${tenant.id}`,
        );
        throw new NotFoundException('User not found');
      }

      const templateData: NewUserEmailDto = {
        tenantName: tenant?.tenantName,
        name: `${user?.firstName} ${user?.lastName}`,
        username: user?.username,
        password,
      };

      const payload: SendEmailDto = {
        recipients: [user.email || ''],
        cc: [],
        templateName: 'FleetNexaUserPasswordReset',
        templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error(error, 'Error sending new user welcome email', {
        userId,
        tenantId: tenant.id,
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, type: UserType) {
    try {
      const templateData: VerificationEmailDto = {
        verificationCode: token,
      };

      const templateName =
        type === UserType.STOREFRONT
          ? 'RentNexaPasswordReset'
          : 'FleetNexaPasswordReset';

      const payload: SendEmailDto = {
        recipients: [email],
        cc: [],
        templateName,
        templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error(error, 'Error sending password reset email', {
        email,
      });
      throw error;
    }
  }

  async sendWelcomeEmail(user: User, tenant: Tenant) {
    try {
      const templateData: WelcomeEmailDto = {
        tenantName: tenant.tenantName,
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
      };

      const payload: SendEmailDto = {
        recipients: [user.email || ''],
        cc: [],
        templateName: 'FleetNexaWelcome',
        templateData,
        sender: 'no-reply@fleetnexa.com',
        senderName: 'FleetNexa',
      };

      await this.notify.sendEmail(payload);
    } catch (error) {
      this.logger.error(error, 'Error sending welcome email', {
        userId: user.id,
        tenantId: tenant.id,
      });
      throw error;
    }
  }
}
