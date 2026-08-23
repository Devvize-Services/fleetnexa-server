import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { BookingDepositDto } from '../dto/booking-deposit.dto';
import { SecurityDeposit, Tenant, User } from 'src/generated/prisma/client';
import { BookingRepository } from '../booking.repository';
import { CustomerService } from 'src/modules/customer/customer.service';
import { randomUUID } from 'crypto';
import { PaymentService } from 'src/modules/finance/payment/payment.service';

@Injectable()
export class BookingDepositService {
  private readonly logger = new Logger(BookingDepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingRepo: BookingRepository,
    private readonly paymentService: PaymentService,
    private readonly customerService: CustomerService,
  ) {}

  private async updateSecurityDeposit(
    securityDeposit: any,
    action: string,
    amount: number,
  ): Promise<void> {
    switch (action) {
      case 'COLLECTED':
        const isCollected =
          securityDeposit.amountCollected + amount >= securityDeposit.amount;
        await this.prisma.securityDeposit.update({
          where: { id: securityDeposit.id },
          data: {
            amountCollected: {
              increment: amount,
            },
            status: isCollected ? 'COLLECTED' : securityDeposit.status,
          },
        });
        break;
      case 'REFUNDED':
        const isRefunded =
          securityDeposit.amountRefunded + amount >= securityDeposit.amount;
        await this.prisma.securityDeposit.update({
          where: { id: securityDeposit.id },
          data: {
            amountRefunded: {
              increment: amount,
            },
            status: isRefunded ? 'REFUNDED' : securityDeposit.status,
          },
        });
        break;
      case 'FORFEITED':
        const isForfeited =
          securityDeposit.amountForfeited + amount >= securityDeposit.amount;
        await this.prisma.securityDeposit.update({
          where: { id: securityDeposit.id },
          data: {
            amountForfeited: {
              increment: amount,
            },
            status: isForfeited ? 'FORFEITED' : securityDeposit.status,
          },
        });
        break;
      case 'WAIVED':
        const newAmount = Math.max(0, securityDeposit.amount - amount);
        await this.prisma.securityDeposit.update({
          where: { id: securityDeposit.id },
          data: {
            amount: newAmount,
            status: newAmount === 0 ? 'WAIVED' : securityDeposit.status,
          },
        });
        break;
      default:
        this.logger.warn(`Invalid action type ${action}`);
        throw new NotFoundException(`Invalid action type ${action}`);
    }
  }

  async createDepositPayment(
    data: BookingDepositDto,
    user: User,
    tenant: Tenant,
  ) {
    try {
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
    } catch (error) {}
  }

  async updateBookingDeposit(
    data: BookingDepositDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      let securityDeposit: SecurityDeposit | null;

      securityDeposit = await this.prisma.securityDeposit.findUnique({
        where: {
          bookingId: data.bookingId,
        },
      });

      if (!securityDeposit) {
        this.logger.warn(
          `No security deposit found for booking ${data.bookingId}`,
        );
        securityDeposit = await this.prisma.securityDeposit.create({
          data: {
            bookingId: data.bookingId,
            amount: 0,
            updatedBy: user.username,
          },
        });
      }

      await this.updateSecurityDeposit(
        securityDeposit,
        data.action,
        data.amount,
      );

      if (data.action === 'FORFEITED') {
        await this.createDepositPayment(data, user, tenant);
      }

      const transaction = await this.prisma.securityDepositTransaction.create({
        data: {
          securityDepositId: securityDeposit.id,
          type: data.action,
          amount: data.amount,
          notes: data.notes,
          paymentDate: new Date(data.paymentDate),
          paymentMethodId: data.paymentMethodId,
          currencyId: data.currencyId,
          createdBy: user.username,
        },
      });

      const updatedBooking = await this.bookingRepo.getBookingById(
        data.bookingId,
      );

      return {
        message: 'Deposit transaction created successfully',
        transaction,
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
