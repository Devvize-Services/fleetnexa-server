import { Attachment, Resend } from 'resend';
import { Global, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountCreatedTemplate,
  BookingConfirmationTemplate,
  PaymentReceiptTemplate,
  WelcomeEmailTemplate,
} from './resend-templates.js';
import { Tenant } from '../../generated/prisma/client.js';
import { CustomerService } from '../../modules/customer/customer.service.js';
import { FormatterService } from '../../common/formatter/formatter.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Global()
@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly client: Resend;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
    private readonly formatter: FormatterService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.client = new Resend(apiKey);
  }

  private async sendEmail(
    templateId: string,
    variables: any,
    to: string,
    attachments: Attachment[] = [],
  ) {
    try {
      const res = await this.client.emails.send({
        from: 'FleetNexa <no-reply@fleetnexa.com>',
        to,
        template: {
          id: templateId,
          variables,
        },
        attachments,
      });

      this.logger.log(res.data);
    } catch (error: any) {
      this.logger.error('Error sending email with Resend:', error);
      throw error;
    }
  }

  async sendAccountCreatedEmail(
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

      if (!user.email) {
        this.logger.warn(
          `User with ID ${userId} does not have an email address`,
        );
        throw new NotFoundException('User email not found');
      }

      const variables: AccountCreatedTemplate = {
        name: `${user?.firstName} ${user?.lastName}`,
        provider: tenant.tenantName,
        username: user.username,
        password: password,
      };

      await this.sendEmail('account-created', variables, user.email);

      this.logger.log(
        `Account created email sent to ${user.email} for user ID ${userId}`,
      );
    } catch (error: any) {
      this.logger.error('Error sending account created email:', error);
      throw error;
    }
  }

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
        this.logger.warn(`Booking with ID ${bookingId} not found`);
        throw new NotFoundException('Booking not found');
      }

      const primaryDriver = await this.customerService.getPrimaryDriver(
        booking.id,
      );

      if (!primaryDriver) {
        this.logger.warn(
          `Primary driver not found for booking ID ${bookingId}`,
        );
        throw new NotFoundException('Primary driver not found');
      }

      if (!primaryDriver.customer.email) {
        this.logger.warn(
          `Primary driver for booking ID ${bookingId} does not have an email address`,
        );
        throw new NotFoundException('Primary driver email not found');
      }

      const variables: BookingConfirmationTemplate = {
        bookingCode: booking.bookingCode || '',
        startDate:
          this.formatter.formatDateToFriendlyDate(booking?.startDate) || '',
        pickupTime:
          this.formatter.formatDateToFriendlyTime(booking?.startDate) || '',
        endDate:
          this.formatter.formatDateToFriendlyDate(booking?.endDate) || '',
        pickupLocation: booking?.pickup.location || '',
        provider: tenant.tenantName,
        vehicle: this.formatter.formatVehicleToFriendly(booking?.vehicle) || '',
        total: this.formatter.formatNumberToTenantCurrency(
          booking?.values?.netTotal || 0,
          currency?.code || 'USD',
        ),
        providerPhone: tenant.number || '',
        providerEmail: tenant.email || '',
        invoiceUrl: includeInvoice
          ? booking?.invoice?.invoiceUrl || ''
          : undefined,
        agreementUrl: includeAgreement
          ? booking?.agreement?.agreementUrl || ''
          : undefined,
      };

      await this.sendEmail(
        'booking-confirmation',
        variables,
        primaryDriver.customer.email,
      );

      this.logger.log(
        `Booking confirmation email sent to ${primaryDriver.customer.email} for booking ID ${bookingId}`,
      );
    } catch (error: any) {
      this.logger.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userId: string, tenant: Tenant) {
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

      if (!user.email) {
        this.logger.warn(
          `User with ID ${userId} does not have an email address`,
        );
        throw new NotFoundException('User email not found');
      }

      const data: WelcomeEmailTemplate = {
        tenantName: tenant.tenantName,
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
      };

      await this.sendEmail('welcome-email', data, user.email);
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error: any) {
      this.logger.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendPaymentReceiptEmail(paymentId: string, tenant: Tenant) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: true,
          customer: true,
          currency: true,
          user: true,
          paymentMethod: true,
          receipt: true,
        },
      });

      if (!payment) {
        this.logger.warn(`Payment with ID ${paymentId} not found`);
        throw new NotFoundException('Payment not found');
      }

      if (!payment.receipt) {
        this.logger.warn(`Receipt for payment ID ${paymentId} not found`);
        throw new NotFoundException('Payment receipt not found');
      }

      if (!payment.customer) {
        this.logger.warn(`Customer for payment ID ${paymentId} not found`);
        throw new NotFoundException('Customer not found');
      }

      if (!payment.customer.email) {
        this.logger.warn(
          `Customer for payment ID ${paymentId} does not have an email address`,
        );
        throw new NotFoundException('Customer email not found');
      }

      const data: PaymentReceiptTemplate = {
        amount: this.formatter.formatNumberToTenantCurrency(
          payment.amount,
          payment.currency?.code || 'USD',
        ),
        bookingCode: payment.booking?.bookingCode || '',
        handledBy: `${payment.user?.firstName?.charAt(0) || ''}. ${payment.user?.lastName || ''}`,
        notes: payment.notes || '',
        paymentDate:
          this.formatter.formatDateToFriendlyDate(payment.paymentDate) || '',
        paymentMethod: payment.paymentMethod.method || '',
        receiptNumber: payment.receipt.receiptNumber || '',
      };

      await this.sendEmail('payment-receipt', data, payment.customer.email, [
        {
          filename: `${payment.receipt.receiptNumber}.pdf`,
          path: payment.receipt.receiptUrl || '',
          contentType: 'application/pdf',
        },
      ]);
    } catch (error: any) {
      this.logger.error('Error sending payment receipt email:', error);
      throw error;
    }
  }
}
