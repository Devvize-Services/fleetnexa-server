import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { BookingRepository } from '../../../modules/booking/booking.repository';
import { TransactionService } from '../../../modules/transaction/transaction.service';
import {
  Tenant,
  TransactionType,
  User,
} from '../../../generated/prisma/client';
import { TransactionDto } from 'src/modules/transaction/transaction.dto';
import { randomUUID } from 'crypto';
import { PaymentDto } from './payment.dto';
import { GeneratorService } from '../../../common/generator/generator.service';
import { ActivityService } from '../../../common/activity/activity.service';
import { ResendService } from '../../../infrastructure/resend/resend.service';
import { PaymentReceiptData } from '../../../types/pdf';
import { FormatterService } from '../../../common/formatter/formatter.service';
import { CustomerService } from '../../../modules/customer/customer.service';
import { randomBytes } from 'crypto';
import { AwsService } from '../../../infrastructure/aws/aws.service';
import { PdfMonkeyService } from '../../../infrastructure/pdfMonkey/pdf.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly bookingRepo: BookingRepository,
    private readonly generator: GeneratorService,
    private readonly activity: ActivityService,
    private readonly resend: ResendService,
    private readonly formatter: FormatterService,
    private readonly pdfMonkey: PdfMonkeyService,
    private readonly customerService: CustomerService,
    private readonly awsService: AwsService,
  ) {}

  async getPayments(tenant: Tenant) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { tenantId: tenant.id },
        include: {
          booking: {
            select: {
              id: true,
              rentalNumber: true,
              bookingCode: true,
            },
          },
          paymentMethod: true,
          paymentType: true,
          receipt: true,
          transaction: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return payments;
    } catch (error: any) {
      this.logger.error(error, 'Error fetching payments', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async createPayment(data: PaymentDto, tenant: Tenant, user: User, res?: any) {
    try {
      const payment = await this.prisma.$transaction(
        async (tx) => {
          const existingBooking = await tx.rental.findFirst({
            where: {
              id: data.bookingId,
              tenantId: tenant.id,
            },
          });

          if (!existingBooking) {
            this.logger.warn(
              `Booking with ID ${data.bookingId} not found for tenant ${tenant.id}`,
            );
            throw new NotFoundException('Booking not found');
          }

          const existingCustomer = await tx.customer.findUnique({
            where: { id: data.customerId, tenantId: tenant.id },
          });

          if (!existingCustomer) {
            this.logger.warn(
              `Customer with ID ${data.customerId} not found for tenant ${tenant.id}`,
            );
            throw new NotFoundException('Customer not found');
          }

          const reference = await this.generator.generatePaymentReferenceNumber(
            tenant.id,
          );

          const newPayment = await tx.payment.create({
            data: {
              amount: data.amount,
              tenantId: tenant.id,
              rentalId: data.bookingId,
              paymentDate: data.paymentDate,
              notes: data.notes,
              paymentTypeId: data.paymentTypeId,
              paymentMethodId: data.paymentMethodId,
              createdAt: new Date(),
              updatedAt: new Date(),
              customerId: data.customerId,
              reference: reference,
              payer: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
              payment: `Payment for Booking #${existingBooking.rentalNumber}`,
              updatedBy: user.username,
            },
          });

          return newPayment;
        },
        { timeout: 50000 },
      );

      await this.activity.logEvent({
        action: 'CREATE',
        description: `Payment of amount ${data.amount} added to booking ID ${data.bookingId}`,
        tenantId: tenant.id,
        userId: user.id,
        module: 'PAYMENT',
        entityType: 'PAYMENT',
        entityId: payment.id,
        newValues: payment,
      });

      const transaction: TransactionDto = {
        id: randomUUID(),
        amount: data.amount,
        type: TransactionType.PAYMENT,
        rentalId: data.bookingId,
        transactionDate: data.paymentDate,
        paymentId: payment.id,
        createdBy: user.username,
        refundId: '',
        expenseId: '',
        securityDepositId: '',
      };

      await this.transactionService.createTransaction(
        transaction,
        tenant,
        user,
      );

      await this.generatePaymentReceipt(payment.id, tenant, user, res);

      if (data.emailReceipt) {
        await this.resend.sendPaymentReceiptEmail(payment.id, tenant);
      }

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );
      const bookings = await this.bookingRepo.getBookings(tenant.id);
      const transactions =
        await this.transactionService.getTransactions(tenant);
      const payments = await this.getPayments(tenant);

      return {
        message: 'Payment created successfully',
        payment,
        updatedBooking,
        bookings,
        transactions,
        payments,
      };
    } catch (error: any) {
      this.logger.error(error, 'Error creating payment', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        paymentData: data,
      });
      throw error;
    }
  }

  async updatePayment(data: PaymentDto, tenant: Tenant, user: User, res?: any) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const existingPayment = await tx.payment.findUnique({
            where: { id: data.id, tenantId: tenant.id },
          });

          if (!existingPayment) {
            this.logger.warn(
              `Payment with ID ${data.id} not found for tenant ${tenant.id}`,
            );
            throw new NotFoundException('Payment not found');
          }

          const existingCustomer = await tx.customer.findUnique({
            where: { id: data.customerId, tenantId: tenant.id },
          });

          if (!existingCustomer) {
            this.logger.warn(
              `Customer with ID ${data.customerId} not found for tenant ${tenant.id}`,
            );
            throw new NotFoundException('Customer not found');
          }

          const existingBooking = await tx.rental.findFirst({
            where: {
              id: data.bookingId,
              tenantId: tenant.id,
            },
          });

          if (!existingBooking) {
            this.logger.warn(
              `Booking with ID ${data.bookingId} not found for tenant ${tenant.id}`,
            );
            throw new NotFoundException('Booking not found');
          }

          const updatedPayment = await tx.payment.update({
            where: { id: data.id },
            data: {
              amount: data.amount,
              rentalId: data.bookingId,
              paymentDate: data.paymentDate,
              notes: data.notes,
              paymentTypeId: data.paymentTypeId,
              paymentMethodId: data.paymentMethodId,
              updatedAt: new Date(),
              customerId: data.customerId,
              payer: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
              payment: `Payment for booking #${existingBooking.rentalNumber}`,
              updatedBy: user.username,
            },
          });

          await this.activity.logEvent({
            action: 'UPDATE',
            description: `Payment of amount ${data.amount} updated for booking ID ${data.bookingId}`,
            tenantId: tenant.id,
            userId: user.id,
            module: 'PAYMENT',
            entityType: 'PAYMENT',
            entityId: data.id,
            oldValues: existingPayment,
            newValues: updatedPayment,
          });

          return updatedPayment;
        },
        { timeout: 50000 },
      );

      const existingTransaction = await this.prisma.transactions.findFirst({
        where: { paymentId: data.id },
      });

      if (!existingTransaction) {
        this.logger.warn(
          `Transaction for payment ID ${data.id} not found for tenant ${tenant.id}`,
        );
        throw new NotFoundException('Associated transaction not found');
      }

      const transaction: TransactionDto = {
        id: existingTransaction.id,
        amount: data.amount,
        type: TransactionType.PAYMENT,
        transactionDate: data.paymentDate,
        rentalId: data.bookingId,
        createdBy: user.username,
        paymentId: '',
        refundId: '',
        expenseId: '',
        securityDepositId: '',
      };

      await this.transactionService.updateTransaction(
        transaction,
        tenant,
        user,
      );

      await this.generatePaymentReceipt(data.id, tenant, user, res);

      if (data.emailReceipt) {
        await this.resend.sendPaymentReceiptEmail(data.id, tenant);
      }

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );
      const bookings = await this.bookingRepo.getBookings(tenant.id);
      const transactions =
        await this.transactionService.getTransactions(tenant);
      const payments = await this.getPayments(tenant);

      return {
        message: 'Payment updated successfully',
        updatedBooking,
        bookings,
        transactions,
        payments,
      };
    } catch (error: any) {
      this.logger.error(error, 'Error updating payment', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        paymentData: data,
      });
      throw error;
    }
  }

  async getPaymentReceipts(tenant: Tenant) {
    try {
      const receipts = await this.prisma.paymentReceipt.findMany({
        where: { tenantId: tenant.id },
        include: {
          payment: true,
          booking: true,
          customer: true,
        },
      });

      return receipts;
    } catch (error: any) {
      this.logger.error(error, 'Error fetching payment receipts', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getPaymentReceiptByToken(accessToken: string) {
    try {
      const receipt = await this.prisma.paymentReceipt.findUnique({
        where: { accessToken },
      });

      if (!receipt) {
        this.logger.warn(
          `Payment receipt with access token ${accessToken} not found`,
        );
        throw new NotFoundException('Payment receipt not found');
      }

      const url = new URL(receipt.receiptUrl!);

      const key = decodeURIComponent(url.pathname.substring(1));

      const signedUrl = await this.awsService.getSignedDownloadUrl(key);

      return signedUrl;
    } catch (error: any) {
      this.logger.error(error, 'Error fetching payment receipt by token', {
        accessToken,
      });
      throw error;
    }
  }

  async generatePaymentReceipt(
    paymentId: string,
    tenant: Tenant,
    user: User,
    res?: any,
  ) {
    try {
      let receiptNumber: string;

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      const existingPaymentReceipt =
        await this.prisma.paymentReceipt.findUnique({
          where: { paymentId, tenantId: tenant.id },
        });

      if (existingPaymentReceipt) {
        receiptNumber = existingPaymentReceipt.receiptNumber;
      } else {
        receiptNumber = await this.generator.generatePaymentReceiptNumber(
          tenant.id,
        );
      }

      const data = await this.generatePaymentReceiptData(
        paymentId,
        tenant.id,
        payment?.rentalId || '',
      );

      data.receiptNumber = receiptNumber;
      const pdfResult = await this.pdfMonkey.createPaymentReceipt(
        data,
        receiptNumber,
        tenant.tenantCode,
      );

      const primaryDriver = await this.customerService.getPrimaryDriver(
        payment?.rentalId || '',
      );

      if (!primaryDriver) {
        throw new NotFoundException('Primary driver not found');
      }

      const accessToken = randomBytes(32).toString('hex');

      const receipt = await this.prisma.paymentReceipt.upsert({
        where: { paymentId },
        create: {
          receiptNumber,
          paymentId,
          bookingId: payment?.rentalId || '',
          tenantId: tenant.id!,
          createdAt: new Date(),
          receiptUrl: pdfResult.publicUrl,
          customerId: primaryDriver?.driverId || '',
          amount: payment?.amount || 0,
          createdBy: user.username,
          accessToken,
        },
        update: {
          receiptUrl: pdfResult.publicUrl,
          amount: payment?.amount || 0,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      this.logger.log(
        `Payment receipt ${receipt.receiptNumber} ${existingPaymentReceipt ? 'regenerated' : 'generated'} for payment ${paymentId}`,
      );

      await this.activity.logEvent({
        action: 'UPDATE',
        module: 'RECEIPT',
        entityId: receipt.id,
        entityType: 'PaymentReceipt',
        userId: user.id,
        description: `Payment receipt ${receipt.receiptNumber} ${existingPaymentReceipt ? 'regenerated' : 'generated'} for payment ${paymentId}`,
        tenantId: tenant.id,
        oldValues: existingPaymentReceipt ? { ...existingPaymentReceipt } : {},
        newValues: { ...receipt },
        ipAddress: res?.ip || '',
        userAgent: res?.headers?.['user-agent'] || '',
      });

      return {
        message: 'Payment receipt generated successfully',
        receipt,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to generate payment receipt', {
        paymentId,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async generatePaymentReceiptData(
    paymentId: string,
    tenantId: string,
    bookingId: string,
  ): Promise<PaymentReceiptData> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          currency: true,
        },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: true,
          transaction: true,
          paymentMethod: true,
        },
      });

      if (!payment) {
        this.logger.warn(
          `Payment with ID ${paymentId} not found for tenant ${tenantId}`,
        );
        throw new NotFoundException('Payment not found');
      }

      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
      });

      const data: PaymentReceiptData = {
        logoUrl: tenant.logo || '',
        companyName: tenant.tenantName || '',
        email: tenant.email || '',
        phone: tenant.number || '',
        transactionNumber: payment?.transaction?.number || '',
        receiptNumber: '',
        bookingCode: booking?.bookingCode || '',
        paymentDate: this.formatter.formatDateToFriendly(
          payment.createdAt || '',
        ),
        paymentMethod: payment.paymentMethod?.method || '',
        handledBy: payment.transaction?.createdBy || '',
        notes: payment.notes || '',
        currency: tenant.currency?.code || 'XCD',
        amount: payment.amount || 0,
      };

      return data;
    } catch (error: any) {
      this.logger.error(error, 'Failed to generate payment receipt data', {
        paymentId,
        tenantId,
        bookingId,
      });
      throw new Error('Failed to generate payment receipt data');
    }
  }
}
