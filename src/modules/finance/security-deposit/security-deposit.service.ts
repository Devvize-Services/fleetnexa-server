import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { BookingRepository } from '../../../modules/booking/booking.repository';
import { PaymentService } from '../payment/payment.service';
import { SecurityDepositDto } from './security-deposit.dto';
import {
  SecurityDeposit,
  Tenant,
  TransactionType,
  User,
} from '../../../generated/prisma/client';
import { randomUUID } from 'crypto';
import { TransactionService } from '../../../modules/transaction/transaction.service';
import { TransactionDto } from '../../../modules/transaction/transaction.dto';
import { ActivityService } from '../../../common/activity/activity.service';
import { CustomerService } from '../../../modules/customer/customer.service';

@Injectable()
export class SecurityDepositService {
  private readonly logger = new Logger(SecurityDepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingRepo: BookingRepository,
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionService,
    private readonly activity: ActivityService,
    private readonly customerService: CustomerService,
  ) {}

  async getSecurityDeposit(bookingId: string, user: User) {
    let securityDeposit: SecurityDeposit | null;

    securityDeposit = await this.prisma.securityDeposit.findUnique({
      where: {
        bookingId: bookingId,
      },
    });

    if (!securityDeposit) {
      this.logger.warn(`No security deposit found for booking ${bookingId}`);
      securityDeposit = await this.prisma.securityDeposit.create({
        data: {
          bookingId: bookingId,
          amount: 0,
          updatedBy: user.username,
        },
      });
    }

    return securityDeposit;
  }

  async collectSecurityDeposit(
    data: SecurityDepositDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const securityDeposit = await this.getSecurityDeposit(
        data.bookingId,
        user,
      );

      const isCollected =
        securityDeposit.amountCollected + data.amount >= securityDeposit.amount;

      await this.prisma.securityDeposit.update({
        where: { id: securityDeposit.id },
        data: {
          amountCollected: {
            increment: data.amount,
          },
          status: isCollected ? 'COLLECTED' : securityDeposit.status,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const transaction: TransactionDto = {
        id: randomUUID(),
        amount: data.amount,
        type: TransactionType.SECURITY_DEPOSIT_COLLECTED,
        rentalId: data.bookingId,
        transactionDate: data.paymentDate,
        paymentId: '',
        createdBy: user.username,
        refundId: '',
        expenseId: '',
        securityDepositId: securityDeposit.id,
      };

      await this.transactionService.createTransaction(
        transaction,
        tenant,
        user,
      );

      await this.activity.logEvent({
        action: 'PAYMENT',
        description: `Security deposit of amount ${data.amount} collected for booking ID ${data.bookingId}`,
        tenantId: tenant.id,
        userId: user.id,
        module: 'BOOKING',
        entityType: 'SECURITY_DEPOSIT',
        entityId: securityDeposit.id,
        oldValues: securityDeposit,
        newValues: {
          ...securityDeposit,
          amountCollected: securityDeposit.amountCollected + data.amount,
          status: isCollected ? 'COLLECTED' : securityDeposit.status,
        },
      });

      return {
        message: 'Security deposit collected successfully',
        updatedBooking: await this.bookingRepo.getBookingById(data.bookingId),
        bookings: await this.bookingRepo.getBookings(tenant.id),
      };
    } catch (error) {
      this.logger.error(
        `Failed to collect security deposit for booking ${data.bookingId}`,
        error,
      );
      throw error;
    }
  }

  async refundSecurityDeposit(
    data: SecurityDepositDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const securityDeposit = await this.getSecurityDeposit(
        data.bookingId,
        user,
      );

      const isRefunded =
        securityDeposit.amountRefunded + data.amount >= securityDeposit.amount;

      await this.prisma.securityDeposit.update({
        where: { id: securityDeposit.id },
        data: {
          amountRefunded: {
            increment: data.amount,
          },
          status: isRefunded ? 'CLOSED' : securityDeposit.status,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const transaction: TransactionDto = {
        id: randomUUID(),
        amount: data.amount,
        type: TransactionType.SECURITY_DEPOSIT_REFUNDED,
        rentalId: data.bookingId,
        transactionDate: data.paymentDate,
        paymentId: '',
        createdBy: user.username,
        refundId: '',
        expenseId: '',
        securityDepositId: securityDeposit.id,
      };

      await this.transactionService.createTransaction(
        transaction,
        tenant,
        user,
      );

      await this.activity.logEvent({
        action: 'REFUND',
        description: `Security deposit of amount ${data.amount} refunded for booking ID ${data.bookingId}`,
        tenantId: tenant.id,
        userId: user.id,
        module: 'BOOKING',
        entityType: 'SECURITY_DEPOSIT',
        entityId: securityDeposit.id,
        oldValues: securityDeposit,
        newValues: {
          ...securityDeposit,
          amountCollected: securityDeposit.amountCollected + data.amount,
          status: isRefunded ? 'REFUNDED' : securityDeposit.status,
        },
      });

      return {
        message: 'Security deposit refunded successfully',
        updatedBooking: await this.bookingRepo.getBookingById(data.bookingId),
        bookings: await this.bookingRepo.getBookings(tenant.id),
      };
    } catch (error) {
      this.logger.error(
        `Failed to refund security deposit for booking ${data.bookingId}`,
        error,
      );
      throw error;
    }
  }

  async forfeitSecurityDeposit(
    data: SecurityDepositDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const securityDeposit = await this.getSecurityDeposit(
        data.bookingId,
        user,
      );

      const isForfeited =
        securityDeposit.amountForfeited + data.amount >= securityDeposit.amount;

      await this.prisma.securityDeposit.update({
        where: { id: securityDeposit.id },
        data: {
          amountForfeited: {
            increment: data.amount,
          },
          status: isForfeited ? 'CLOSED' : securityDeposit.status,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const transaction: TransactionDto = {
        id: randomUUID(),
        amount: data.amount,
        type: TransactionType.PAYMENT,
        rentalId: data.bookingId,
        transactionDate: data.paymentDate,
        paymentId: '',
        createdBy: user.username,
        refundId: '',
        expenseId: '',
        securityDepositId: securityDeposit.id,
      };

      await this.transactionService.createTransaction(
        transaction,
        tenant,
        user,
      );

      const customer = await this.customerService.getPrimaryDriver(
        data.bookingId,
      );

      const paymentType = await this.prisma.paymentType.findFirst({
        where: { type: 'Security Deposit' },
      });

      if (!customer) {
        this.logger.warn(
          `No primary driver found for booking ${data.bookingId}`,
        );
        throw new NotFoundException(
          `Primary driver not found for booking ${data.bookingId}`,
        );
      }

      await this.paymentService.createPayment(
        {
          id: randomUUID(),
          amount: data.amount,
          bookingId: data.bookingId,
          customerId: customer.customer.id,
          paymentMethodId: data.paymentMethodId,
          paymentDate: data.paymentDate,
          currencyId: data.currencyId,
          paymentTypeId: paymentType?.id || '',
          notes: `Security deposit held for booking ${data.bookingId}`,
        },
        tenant,
        user,
      );

      await this.activity.logEvent({
        action: 'PAYMENT',
        description: `Security deposit of amount ${data.amount} collected for booking ID ${data.bookingId}`,
        tenantId: tenant.id,
        userId: user.id,
        module: 'BOOKING',
        entityType: 'SECURITY_DEPOSIT',
        entityId: securityDeposit.id,
        oldValues: securityDeposit,
        newValues: {
          ...securityDeposit,
          amountCollected: securityDeposit.amountCollected + data.amount,
          status: isForfeited ? 'CLOSED' : securityDeposit.status,
        },
      });

      return {
        message: 'Security deposit forfeited successfully',
        updatedBooking: await this.bookingRepo.getBookingById(data.bookingId),
        bookings: await this.bookingRepo.getBookings(tenant.id),
      };
    } catch (error) {
      this.logger.error(
        `Failed to forfeit security deposit for booking ${data.bookingId}`,
        error,
      );
      throw error;
    }
  }

  async waiveSecurityDeposit(
    data: SecurityDepositDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const securityDeposit = await this.getSecurityDeposit(
        data.bookingId,
        user,
      );

      const newAmount = Math.max(0, securityDeposit.amount - data.amount);

      await this.prisma.securityDeposit.update({
        where: { id: securityDeposit.id },
        data: {
          amountWaived: {
            increment: data.amount,
          },
          status: newAmount === 0 ? 'WAIVED' : securityDeposit.status,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      await this.activity.logEvent({
        action: 'UPDATE',
        description: `Security deposit of amount ${data.amount} waived for booking ID ${data.bookingId}`,
        tenantId: tenant.id,
        userId: user.id,
        module: 'BOOKING',
        entityType: 'SECURITY_DEPOSIT',
        entityId: securityDeposit.id,
        oldValues: securityDeposit,
        newValues: {
          ...securityDeposit,
          amount: newAmount,
          status: newAmount === 0 ? 'WAIVED' : securityDeposit.status,
        },
      });

      return {
        message: 'Security deposit waived successfully',
        updatedBooking: await this.bookingRepo.getBookingById(data.bookingId),
        bookings: await this.bookingRepo.getBookings(tenant.id),
      };
    } catch (error) {
      this.logger.error(
        `Failed to waive security deposit for booking ${data.bookingId}`,
        error,
      );
      throw error;
    }
  }

  async updateBookingDeposit(data: SecurityDepositDto, user: User) {
    try {
      const securityDeposit = await this.getSecurityDeposit(
        data.bookingId,
        user,
      );

      const hasChanges = securityDeposit.amount !== data.amount;

      if (!hasChanges) {
        this.logger.log(
          `No changes detected for security deposit of booking ${data.bookingId}`,
        );
        return {
          message: 'No changes detected for security deposit',
          updatedBooking: await this.bookingRepo.getBookingById(data.bookingId),
        };
      }

      await this.prisma.securityDeposit.update({
        where: { id: securityDeposit.id },
        data: {
          amount: data.amount,
          status: 'PENDING',
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );

      return {
        message: 'Deposit transaction created successfully',
        updatedBooking,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create deposit transaction for booking ${data.bookingId}`,
        error,
      );
      throw error;
    }
  }
}
