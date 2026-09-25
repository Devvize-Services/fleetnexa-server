import { Injectable, Logger } from '@nestjs/common';
import { TransactionDto } from './transaction.dto.js';
import { Tenant, User } from '../../generated/prisma/client.js';
import { TransactionRepository } from './transaction.repository.js';
import { GeneratorService } from '../../common/generator/generator.service.js';
import {
  PrismaService,
  TxClient,
} from '../../infrastructure/prisma/prisma.service.js';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRepo: TransactionRepository,
    private readonly generator: GeneratorService,
  ) {}

  async getTransactions(tenant: Tenant) {
    try {
      return await this.transactionRepo.getTransactions(tenant.id);
    } catch (error: any) {
      this.logger.error(error, 'Error fetching transactions', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async createTransaction(data: TransactionDto, tenant: Tenant, user: User) {
    try {
      const transactionNumber = await this.generator.generateTransactionNumber(
        tenant.id,
      );

      await this.prisma.$transaction(async (tx: TxClient) => {
        await tx.transactions.create({
          data: {
            id: data.id,
            amount: data.amount,
            type: data.type,
            transactionDate: data.transactionDate,
            createdBy: user.username,
            paymentId: data.paymentId || null,
            refundId: data.refundId || null,
            expenseId: data.expenseId || null,
            tenantId: tenant.id,
            rentalId: data.rentalId,
            securityDepositId: data.securityDepositId || null,
          },
        });
      });
    } catch (error: any) {
      this.logger.error(error, 'Failed to create transaction', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateTransaction(data: TransactionDto, tenant: Tenant, user: User) {
    try {
      await this.prisma.$transaction(async (tx: TxClient) => {
        const existingTransaction = await tx.transactions.findUnique({
          where: { id: data.id },
        });
        if (!existingTransaction) {
          throw new Error('Transaction not found');
        }

        await tx.transactions.update({
          where: { id: data.id },
          data: {
            amount: data.amount,
            transactionDate: data.transactionDate,
            updatedAt: new Date(),
            updatedBy: user.username,
            rentalId: data.rentalId,
          },
        });
      });
    } catch (error: any) {
      this.logger.error(error, 'Failed to update transaction', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async deleteTransaction(id: string, tenant: Tenant, user: User) {
    try {
      await this.prisma.$transaction(async (tx: TxClient) => {
        const existingTransaction = await tx.transactions.findUnique({
          where: { id },
        });
        if (!existingTransaction) {
          throw new Error('Transaction not found');
        }
        await tx.transactions.update({
          where: { id },
          data: {
            isDeleted: true,
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      });
    } catch (error: any) {
      this.logger.error(error, 'Failed to delete transaction', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        transactionId: id,
      });
      throw error;
    }
  }

  async deleteBookingTransaction(id: string, tx: TxClient) {
    try {
      const booking = await tx.rental.findUnique({
        where: { id },
      });
      if (!booking) {
        this.logger.error('Booking not found', 'Failed to delete booking');
        return;
      }
      await tx.transactions.updateMany({
        where: { rentalId: id },
        data: { isDeleted: true },
      });
      await tx.payment.updateMany({
        where: { rentalId: id },
        data: { isDeleted: true },
      });
      await tx.refund.updateMany({
        where: { rentalId: id },
        data: { isDeleted: true },
      });
    } catch (error: any) {
      this.logger.error(error, 'Failed to delete booking transaction', { id });
      throw error;
    }
  }
}
