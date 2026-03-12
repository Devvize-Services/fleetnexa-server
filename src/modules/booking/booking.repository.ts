import { Prisma } from 'src/generated/prisma/client.js';
import { PrismaService } from 'src/prisma/prisma.service.js';

export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBookings(
    tenantId: string,
    additionalWhere?: Prisma.RentalWhereInput,
  ) {
    return this.prisma.rental.findMany({
      where: {
        tenantId,
        isDeleted: false,
        ...additionalWhere,
      },
      include: this.getBookingIncludeOptions(),
    });
  }

  async getBookingById(id: string, tenantId: string) {
    return this.prisma.rental.findUnique({
      where: { id, tenantId, isDeleted: false },
      include: this.getBookingIncludeOptions(),
    });
  }

  async getBookingByCode(bookingCode: string, tenantId: string) {
    return this.prisma.rental.findUnique({
      where: { bookingCode, tenantId, isDeleted: false },
      include: this.getBookingIncludeOptions(),
    });
  }

  async getBookingByCustomerId(
    customerId: string,
    tenantId: string,
    additionalWhere?: Prisma.RentalWhereInput,
  ) {
    return this.prisma.rental.findMany({
      where: {
        tenantId,
        isDeleted: false,
        drivers: {
          some: {
            driverId: customerId,
          },
        },
        ...additionalWhere,
      },
      include: this.getBookingIncludeOptions(),
    });
  }

  private getBookingIncludeOptions(): Prisma.RentalInclude {
    return {
      pickup: true,
      return: true,
      invoice: true,
      agreement: true,
      chargeType: true,
      paymentReceipts: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      charges: true,
      refunds: {
        where: { isDeleted: false },
        include: {
          customer: true,
        },
      },
      transactions: {
        where: { isDeleted: false },
        include: {
          payment: {
            include: {
              customer: true,
              paymentMethod: true,
              paymentType: true,
              receipt: true,
            },
          },
          refund: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
      },
      vehicle: {
        include: {
          brand: true,
          model: {
            include: {
              bodyType: true,
            },
          },
          vehicleStatus: true,
          transmission: true,
          wheelDrive: true,
          fuelType: true,
          features: true,
          damages: {
            where: { isDeleted: false },
            include: {
              customer: true,
            },
          },
        },
      },
      drivers: {
        include: {
          customer: {
            include: {
              license: true,
              address: {
                include: {
                  village: true,
                  country: true,
                  state: true,
                },
              },
              violations: {
                where: { isDeleted: false },
                include: {
                  violation: true,
                },
              },
            },
          },
        },
      },
      payments: {
        where: { isDeleted: false },
        include: {
          paymentMethod: true,
          paymentType: true,
          receipt: true,
        },
      },
      values: {
        include: {
          extras: true,
        },
      },
    };
  }
}
