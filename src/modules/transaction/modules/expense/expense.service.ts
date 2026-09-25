import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ExpenseDto } from './expense.dto.js';
import {
  Tenant,
  TransactionType,
  User,
} from '../../../../generated/prisma/client.js';
import { TransactionDto } from '../../transaction.dto.js';
import { randomUUID } from 'crypto';
import { TransactionService } from '../../transaction.service.js';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service.js';

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transaction: TransactionService,
  ) {}

  async getTenantExpenses(tenant: Tenant) {
    try {
      const expenses = await this.prisma.expense.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
        include: {
          vendor: true,
          vehicle: true,
          maintenance: true,
        },
      });
      return expenses;
    } catch (error: any) {
      this.logger.error(error, 'Error fetching tenant expenses', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async createExpense(data: ExpenseDto, tenant: Tenant, user: User) {
    try {
      await this.prisma.expense.create({
        data: {
          id: data.id,
          amount: data.amount,
          expenseDate: data.expenseDate,
          notes: data.notes,
          vendorId: data.vendorId,
          vehicleId: data.vehicleId,
          tenantId: tenant.id,
          maintenanceId: data.maintenanceId,
          createdBy: user.username,
          expense: data.expense,
          payee: data.payee,
        },
      });

      const transaction: TransactionDto = {
        id: randomUUID(),
        amount: data.amount,
        type: TransactionType.EXPENSE,
        transactionDate: data.expenseDate,
        expenseId: data.id,
        createdBy: user.username,
        paymentId: '',
        refundId: '',
        rentalId: '',
        securityDepositId: '',
      };

      await this.transaction.createTransaction(transaction, tenant, user);

      const expenses = await this.getTenantExpenses(tenant);
      const transactions = await this.transaction.getTransactions(tenant);

      return {
        message: 'Expense created successfully',
        expenses,
        transactions,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to create expense', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateExpense(data: ExpenseDto, tenant: Tenant, user: User) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const existingExpense = await tx.expense.findUnique({
            where: { id: data.id },
          });

          if (!existingExpense) {
            this.logger.warn(
              `Expense with ID ${data.id} not found for tenant ${tenant.id}`,
            );
            throw new NotFoundException('Expense not found');
          }

          await tx.expense.update({
            where: { id: data.id },
            data: {
              amount: data.amount,
              expenseDate: data.expenseDate,
              notes: data.notes,
              vendorId: data.vendorId,
              payee: data.payee,
              expense: data.expense,
              maintenanceId: data.maintenanceId,
              vehicleId: data.vehicleId,
              updatedAt: new Date(),
            },
          });

          const existingTransaction = await tx.transactions.findFirst({
            where: { expenseId: data.id },
          });

          if (!existingTransaction) {
            this.logger.warn(
              `Associated transaction not found for expense ID ${data.id} and tenant ${tenant.id}`,
            );
            throw new NotFoundException('Associated transaction not found');
          }

          const transaction: TransactionDto = {
            id: existingTransaction.id,
            amount: data.amount,
            transactionDate: data.expenseDate,
            type: TransactionType.EXPENSE,
            createdBy: user.username,
            paymentId: '',
            refundId: '',
            expenseId: '',
            rentalId: '',
            securityDepositId: '',
          };

          await this.transaction.updateTransaction(transaction, tenant, user);

          await tx.transactions.update({
            where: { id: existingTransaction.id },
            data: {
              amount: data.amount,
              transactionDate: data.expenseDate,
              updatedAt: new Date(),
              updatedBy: user.username,
            },
          });
        },
        { timeout: 50000 },
      );

      const expenses = await this.getTenantExpenses(tenant);
      const transactions = await this.transaction.getTransactions(tenant);

      return {
        message: 'Expense updated successfully',
        expenses,
        transactions,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to update expense', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async deleteExpense(expenseId: string, tenant: Tenant, user: User) {
    try {
      const existingExpense = await this.prisma.expense.findUnique({
        where: { id: expenseId },
      });

      if (!existingExpense) {
        this.logger.warn(
          `Expense with ID ${expenseId} not found for tenant ${tenant.id}`,
        );
        throw new NotFoundException('Expense not found');
      }

      const existingTransaction = await this.prisma.transactions.findFirst({
        where: { expenseId: expenseId },
      });

      if (!existingTransaction) {
        this.logger.warn(
          `Associated transaction not found for expense ID ${expenseId} and tenant ${tenant.id}`,
        );
        throw new NotFoundException('Associated transaction not found');
      }

      await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      });

      await this.transaction.deleteTransaction(
        existingTransaction.id,
        tenant,
        user,
      );

      const expenses = await this.getTenantExpenses(tenant);
      const transactions = await this.transaction.getTransactions(tenant);

      return {
        message: 'Expense deleted successfully',
        expenses,
        transactions,
      };
    } catch (error: any) {
      this.logger.error(error, 'Error deleting expense', {
        user: user.username,
        tenant: tenant.id,
        tenantCode: tenant.tenantCode,
        expenseId: expenseId,
      });
      throw error;
    }
  }
}
