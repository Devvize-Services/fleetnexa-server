import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { TransactionService } from '../../transaction.service.js';
import {
  Tenant,
  TransactionType,
  User,
} from '../../../../generated/prisma/client.js';
import { PaymentDto } from './payment.dto.js';
import { TransactionDto } from '../../transaction.dto.js';
import { v4 as uuidv4 } from 'uuid';
import { DocumentService } from '../../../../modules/document/document.service.js';
import { BookingRepository } from '../../../../modules/booking/booking.repository.js';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly bookingRepo: BookingRepository,
    private readonly document: DocumentService,
  ) {}

  async getPayments(tenant: Tenant) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { tenantId: tenant.id },
        include: {
          rental: true,
          paymentMethod: true,
          paymentType: true,
          receipt: true,
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
    } catch (error) {
      this.logger.error(error, 'Error fetching payments', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async createPayment(data: PaymentDto, tenant: Tenant, user: User) {
    try {
      const payment = await this.prisma.$transaction(async (tx) => {
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
            payer: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
            payment: `Payment for booking #${existingBooking.rentalNumber}`,
            updatedBy: user.username,
          },
        });
        return newPayment;
      });

      const transaction: TransactionDto = {
        id: uuidv4(),
        amount: data.amount,
        type: TransactionType.PAYMENT,
        rentalId: data.bookingId,
        transactionDate: data.paymentDate,
        paymentId: payment.id,
        createdBy: user.username,
        refundId: '',
        expenseId: '',
      };

      await this.transactionService.createTransaction(
        transaction,
        tenant,
        user,
      );

      await this.document.generatePaymentReceipt(
        payment.id,
        data.bookingId,
        tenant,
        user,
      );

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
    } catch (error) {
      this.logger.error(error, 'Error creating payment', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        paymentData: data,
      });
      throw error;
    }
  }

  async updatePayment(data: PaymentDto, tenant: Tenant, user: User) {
    try {
      await this.prisma.$transaction(async (tx) => {
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

        return updatedPayment;
      });

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
      };

      await this.transactionService.updateTransaction(
        transaction,
        tenant,
        user,
      );

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
    } catch (error) {
      this.logger.error(error, 'Error updating payment', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        paymentData: data,
      });
      throw error;
    }
  }
}
