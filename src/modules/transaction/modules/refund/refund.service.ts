import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { TransactionService } from '../../transaction.service.js';
import {
  Tenant,
  TransactionType,
  User,
} from '../../../../generated/prisma/client.js';
import { RefundDto } from './refund.dto.js';
import { TransactionDto } from '../../transaction.dto.js';
import { v4 as uuidv4 } from 'uuid';
import { BookingRepository } from '../../../../modules/booking/booking.repository.js';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transaction: TransactionService,
    private readonly bookingRepo: BookingRepository,
  ) {}

  async getTenantRefunds(tenant: Tenant) {
    try {
      const refunds = await this.prisma.refund.findMany({
        where: { tenantId: tenant.id },
        include: {
          rental: true,
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
      return refunds;
    } catch (error) {
      this.logger.error(error, 'Error fetching tenant refunds', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async createRefund(data: RefundDto, tenant: Tenant, user: any) {
    try {
      const refund = await this.prisma.$transaction(async (tx) => {
        const existingBooking = await tx.rental.findUnique({
          where: { id: data.bookingId },
        });

        if (!existingBooking) {
          this.logger.warn(
            `Booking with ID ${data.bookingId} not found for tenant ${tenant.id}`,
          );
          throw new NotFoundException('Booking not found');
        }

        const existingCustomer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });

        if (!existingCustomer) {
          this.logger.warn(
            `Customer with ID ${data.customerId} not found for tenant ${tenant.id}`,
          );
          throw new NotFoundException('Customer not found');
        }

        const newRefund = await tx.refund.create({
          data: {
            id: data.id,
            amount: data.amount,
            refundDate: new Date(data.refundDate),
            reason: data.reason,
            rentalId: data.bookingId,
            tenantId: tenant.id,
            customerId: data.customerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.username,
            payee: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
            payment: `Refund for booking #${existingBooking.rentalNumber}`,
            updatedBy: user.username,
          },
        });

        return newRefund;
      });

      const transaction: TransactionDto = {
        id: uuidv4(),
        amount: data.amount,
        type: TransactionType.REFUND,
        rentalId: data.bookingId,
        transactionDate: refund.refundDate.toISOString(),
        refundId: refund.id,
        createdBy: user.username,
        paymentId: '',
        expenseId: '',
      };

      await this.transaction.createTransaction(transaction, tenant, user);

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );
      const bookings = await this.bookingRepo.getBookings(tenant.id);
      const refunds = await this.getTenantRefunds(tenant);
      const transactions = await this.transaction.getTransactions(tenant);

      return {
        message: 'Refund created successfully',
        refund,
        bookings,
        updatedBooking,
        refunds,
        transactions,
      };
    } catch (error) {
      this.logger.error(error, 'Error creating refund', {
        user: user.username,
        tenant: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateRefund(data: RefundDto, tenant: Tenant, user: any) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existingRefund = await tx.refund.findUnique({
          where: { id: data.id },
        });

        if (!existingRefund) {
          this.logger.warn(
            `Refund with ID ${data.id} not found for tenant ${tenant.id}`,
          );
          throw new NotFoundException('Refund not found');
        }

        const existingCustomer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });

        if (!existingCustomer) {
          this.logger.warn(
            `Customer with ID ${data.customerId} not found for tenant ${tenant.id}`,
          );
          throw new NotFoundException('Customer not found');
        }

        const exitingBooking = await tx.rental.findUnique({
          where: { id: data.bookingId },
        });

        if (!exitingBooking) {
          this.logger.warn(
            `Booking with ID ${data.bookingId} not found for tenant ${tenant.id}`,
          );
          throw new NotFoundException('Booking not found');
        }

        const updatedRefund = await tx.refund.update({
          where: { id: data.id },
          data: {
            amount: data.amount,
            refundDate: new Date(data.refundDate),
            reason: data.reason,
            rentalId: data.bookingId,
            customerId: data.customerId,
            updatedAt: new Date(),
            payee: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
            payment: `Refund for booking #${exitingBooking.rentalNumber}`,
            updatedBy: user.username,
          },
        });

        return updatedRefund;
      });

      const existingTransaction = await this.prisma.transactions.findFirst({
        where: { refundId: data.id },
      });

      if (!existingTransaction) {
        this.logger.warn(
          `Associated transaction not found for refund ID ${data.id} and tenant ${tenant.id}`,
        );
        throw new NotFoundException('Associated transaction not found');
      }

      const transaction: TransactionDto = {
        id: existingTransaction.id,
        amount: data.amount,
        transactionDate: data.refundDate,
        type: TransactionType.RENTAL,
        rentalId: data.bookingId,
        createdBy: user.username,
        paymentId: '',
        refundId: '',
        expenseId: '',
      };

      await this.transaction.updateTransaction(transaction, tenant, user);

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );
      const bookings = await this.bookingRepo.getBookings(tenant.id);
      const refunds = await this.getTenantRefunds(tenant);
      const transactions = await this.transaction.getTransactions(tenant);

      return {
        message: 'Refund updated successfully',
        bookings,
        updatedBooking,
        refunds,
        transactions,
      };
    } catch (error) {
      this.logger.error(error, 'Error updating refund', {
        user: user.username,
        tenant: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async deleteRefund(refundId: string, tenant: Tenant, user: User) {
    try {
      const refund = await this.prisma.$transaction(async (tx) => {
        const existingRefund = await tx.refund.findUnique({
          where: { id: refundId },
        });

        if (!existingRefund) {
          throw new Error('Refund not found');
        }

        const existingTransaction = await tx.transactions.findFirst({
          where: { refundId: refundId },
        });

        if (!existingTransaction) {
          throw new Error('Associated transaction not found');
        }

        await tx.refund.update({
          where: { id: refundId },
          data: {
            isDeleted: true,
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });

        await this.transaction.deleteTransaction(
          existingTransaction.id,
          tenant,
          user,
        );

        return existingRefund;
      });

      const bookings = await this.bookingRepo.getBookings(tenant.id);
      const refunds = await this.getTenantRefunds(tenant);
      const transactions = await this.transaction.getTransactions(tenant);

      return {
        message: 'Refund deleted successfully',
        refund,
        bookings,
        refunds,
        transactions,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting refund', {
        refundId: refundId,
        tenant: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }
}
