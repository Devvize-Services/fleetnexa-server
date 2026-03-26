import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
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

  async getBookingById(id: string) {
    return this.prisma.rental.findUnique({
      where: { id, isDeleted: false },
      include: this.getBookingIncludeOptions(),
    });
  }

  async getBookingByCode(bookingCode: string) {
    return this.prisma.rental.findUnique({
      where: { bookingCode, isDeleted: false },
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

  async getBookingsByDates(
    tenantId: string,
    startOfDay: string,
    endOfDay: string,
  ) {
    return this.prisma.rental.findMany({
      where: {
        tenantId,
        isDeleted: false,
        OR: [
          {
            startDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          {
            endDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        ],
      },
      include: {
        pickup: true,
        return: true,
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
      },
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

  async createBookingValues(
    bookingId: string,
    values: any,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (client: Prisma.TransactionClient) => {
      const { extras, rentalId: _ignoredRentalId, ...valuesData } = values;
      const createdValues = await client.values.create({
        data: {
          ...valuesData,
          rentalId: bookingId,
        },
      });

      if (extras && Array.isArray(extras)) {
        await Promise.all(
          extras.map((extra: any) =>
            client.rentalExtra.create({
              data: {
                id: extra.id,
                extraId: extra.extraId,
                amount: extra.amount,
                customAmount: extra.customAmount,
                valuesId: createdValues.id,
              },
            }),
          ),
        );
      }
      return createdValues;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async updateBookingValues(bookingId: string, values: any) {
    return this.prisma.$transaction(async (tx) => {
      const updatedValues = await tx.values.update({
        where: { rentalId: bookingId },
        data: {
          ...values,
        },
      });

      await tx.rentalExtra.deleteMany({
        where: { valuesId: updatedValues.id },
      });

      if (values.extras && Array.isArray(values.extras)) {
        await Promise.all(
          values.extras.map((extra: any) =>
            tx.rentalExtra.create({
              data: {
                id: extra.id,
                extraId: extra.extraId,
                amount: extra.amount,
                customAmount: extra.customAmount,
                valuesId: updatedValues.id,
              },
            }),
          ),
        );
      }

      return updatedValues;
    });
  }
}
