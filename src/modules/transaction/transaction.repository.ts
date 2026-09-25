import { Global, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

@Global()
@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(
    tenantId: string,
    additionalWhere?: Prisma.TransactionsWhereInput,
  ) {
    return await this.prisma.transactions.findMany({
      where: {
        tenantId,
        isDeleted: false,
        ...additionalWhere,
      },
      include: this.getTransactionIncludeOptions(),
    });
  }

  private getTransactionIncludeOptions(): Prisma.TransactionsInclude {
    return {
      rental: {
        select: {
          id: true,
          rentalNumber: true,
          bookingCode: true,
        },
      },
      payment: {
        include: {
          customer: true,
          paymentMethod: true,
          paymentType: true,
          booking: {
            select: {
              id: true,
              rentalNumber: true,
              bookingCode: true,
            },
          },
        },
      },
      refund: {
        include: {
          customer: true,
          rental: {
            select: {
              id: true,
              rentalNumber: true,
              bookingCode: true,
            },
          },
        },
      },
      expense: {
        include: {
          vendor: true,
          maintenance: {
            select: {
              id: true,
              services: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              brand: true,
              model: true,
              year: true,
            },
          },
        },
      },
      securityDeposit: {
        include: {
          booking: {
            select: {
              id: true,
              rentalNumber: true,
              bookingCode: true,
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    };
  }
}
