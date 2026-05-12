import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Cron } from '@nestjs/schedule';
import {
  getYear,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from 'date-fns';
import { NotificationService } from '../common/notification/notification.service.js';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('* * * * *')
  async monthlyStatsCron() {
    try {
      this.logger.log('Running monthly stats cron...');
      await this.runMonthlyStatCron();
    } catch (error) {
      this.logger.error('Monthly stats cron failed', error);
    }
  }

  @Cron('* * * * *')
  async yearlyStatsCron() {
    try {
      this.logger.log('Running yearly stats cron...');
      await this.runYearlyStatCron();
    } catch (error) {
      this.logger.error('Yearly stats cron failed', error);
    }
  }

  @Cron('0 * * * *')
  async notificationCron() {
    try {
      this.logger.log('Running notification cron...');
      await this.runUnconfirmedRentalsCron();
      await this.runUpcomingRentalsCron();
      await this.runUpcomingReturnsCron();
    } catch (error) {
      this.logger.error('Notification cron failed', error);
    }
  }

  private async runMonthlyStatCron() {
    const tenants = await this.prisma.tenant.findMany();
    const currentYear = getYear(new Date());

    for (const tenant of tenants) {
      const months = eachMonthOfInterval({
        start: new Date(currentYear, 0, 1),
        end: new Date(currentYear, 11, 31),
      });

      for (const monthDate of months) {
        const from = startOfMonth(monthDate);
        const to = endOfMonth(monthDate);

        await Promise.all([
          this.saveMonthlyStat(
            tenant.id,
            from,
            to,
            'MONTHLY_EARNINGS',
            await this.calcMonthlyEarnings(tenant.id, from, to),
          ),
          this.saveMonthlyStat(
            tenant.id,
            from,
            to,
            'MONTHLY_RENTALS',
            await this.calcMonthlyRentals(tenant.id, from, to),
          ),
          this.calcMonthlyRentalStatus(tenant.id, from, to),
        ]);
      }
    }
  }

  private async saveMonthlyStat(
    tenantId: string,
    from: Date,
    to: Date,
    stat: 'MONTHLY_EARNINGS' | 'MONTHLY_RENTALS' | 'MONTHLY_RENTAL_STATUS',
    value: number,
  ) {
    await this.prisma.tenantMonthlyStats.upsert({
      where: {
        tenantId_month_year_stat: {
          tenantId,
          month: from.getMonth() + 1,
          year: from.getFullYear(),
          stat,
        },
      },
      update: { value },
      create: {
        tenantId,
        month: from.getMonth() + 1,
        year: from.getFullYear(),
        stat,
        value,
        startDate: from,
        endDate: to,
      },
    });
  }

  private async calcMonthlyEarnings(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const { _sum: payments } = await this.prisma.transactions.aggregate({
      where: {
        type: 'PAYMENT',
        rental: {
          tenantId,
          startDate: { gte: from, lte: to },
          status: 'COMPLETED',
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });

    const { _sum: refunds } = await this.prisma.transactions.aggregate({
      where: {
        type: 'REFUND',
        rental: {
          tenantId,
          startDate: { gte: from, lte: to },
          status: 'COMPLETED',
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });

    return (payments.amount ?? 0) - (refunds.amount ?? 0);
  }

  private async calcMonthlyRentals(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.prisma.rental.count({
      where: {
        tenantId,
        startDate: { gte: from, lte: to },
        status: 'COMPLETED',
        isDeleted: false,
      },
    });
  }

  private async calcMonthlyRentalStatus(
    tenantId: string,
    from: Date,
    to: Date,
  ) {
    const statuses = [
      'ACTIVE',
      'COMPLETED',
      'DECLINED',
      'CANCELED',
      'REFUNDED',
      'CONFIRMED',
    ] as const;

    for (const status of statuses) {
      const count = await this.prisma.rental.count({
        where: {
          tenantId,
          createdAt: { gte: from, lte: to },
          status,
          isDeleted: false,
        },
      });

      await this.prisma.tenantMonthlyRentalStats.upsert({
        where: {
          tenantId_status_month_year_stat: {
            tenantId,
            status,
            month: from.getMonth() + 1,
            year: from.getFullYear(),
            stat: 'MONTHLY_RENTAL_STATUS',
          },
        },
        update: { value: count },
        create: {
          tenantId,
          status,
          month: from.getMonth() + 1,
          year: from.getFullYear(),
          stat: 'MONTHLY_RENTAL_STATUS',
          value: count,
          startDate: from,
          endDate: to,
        },
      });
    }
  }

  private async runYearlyStatCron() {
    const tenants = await this.prisma.tenant.findMany();
    const currentYear = getYear(new Date());

    for (const tenant of tenants) {
      const years = [currentYear, currentYear - 1];

      for (const year of years) {
        const from = startOfYear(new Date(year, 0, 1));
        const to = endOfYear(new Date(year, 0, 1));

        const revenue = await this.calcYearlyRevenue(tenant.id, from, to);
        const rentals = await this.calcYearlyRentals(tenant.id, from, to);
        const customers = await this.calcYearlyCustomers(tenant.id, from, to);
        const vehicleCount = await this.calcYearlyVehicleCount(
          tenant.id,
          from,
          to,
        );
        const expenses = await this.calcYearlyExpenses(tenant.id, from, to);
        const avgDuration = await this.calcAverageRentalDuration(
          tenant.id,
          from,
          to,
        );

        await Promise.all([
          this.saveYearlyStat(
            tenant.id,
            year,
            'YEARLY_REVENUE',
            revenue,
            from,
            to,
          ),
          this.saveYearlyStat(
            tenant.id,
            year,
            'YEARLY_EXPENSES',
            expenses,
            from,
            to,
          ),
          this.saveYearlyStat(
            tenant.id,
            year,
            'YEARLY_RENTALS',
            rentals,
            from,
            to,
          ),
          this.saveYearlyStat(
            tenant.id,
            year,
            'YEARLY_CUSTOMERS',
            customers,
            from,
            to,
          ),
          this.saveYearlyStat(
            tenant.id,
            year,
            'YEARLY_VEHICLES',
            vehicleCount,
            from,
            to,
          ),

          this.saveYearlyStat(
            tenant.id,
            year,
            'AVERAGE_RENTAL_DURATION',
            avgDuration,
            from,
            to,
          ),
        ]);
      }
    }
  }

  private async saveYearlyStat(
    tenantId: string,
    year: number,
    stat:
      | 'YEARLY_REVENUE'
      | 'YEARLY_EXPENSES'
      | 'YEARLY_RENTALS'
      | 'YEARLY_CUSTOMERS'
      | 'YEARLY_VEHICLES'
      | 'AVERAGE_RENTAL_DURATION',
    value: number,
    from: Date,
    to: Date,
  ) {
    await this.prisma.tenantYearlyStats.upsert({
      where: { tenantId_year_stat: { tenantId, year, stat } },
      update: { value },
      create: { tenantId, year, stat, value, startDate: from, endDate: to },
    });
  }

  private async calcYearlyRevenue(tenantId: string, from: Date, to: Date) {
    const { _sum: payments } = await this.prisma.transactions.aggregate({
      where: {
        type: 'PAYMENT',
        rental: {
          tenantId,
          startDate: { gte: from, lte: to },
          status: 'COMPLETED',
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });
    const { _sum: refunds } = await this.prisma.transactions.aggregate({
      where: {
        type: 'REFUND',
        rental: {
          tenantId,
          startDate: { gte: from, lte: to },
          status: 'COMPLETED',
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });
    return (payments.amount ?? 0) - (refunds.amount ?? 0);
  }

  private async calcYearlyExpenses(tenantId: string, from: Date, to: Date) {
    const { _sum: expenses } = await this.prisma.expense.aggregate({
      where: {
        tenantId,
        expenseDate: { gte: from, lte: to },
        isDeleted: false,
      },
      _sum: { amount: true },
    });
    return expenses.amount ?? 0;
  }

  private async calcYearlyRentals(tenantId: string, from: Date, to: Date) {
    return this.prisma.rental.count({
      where: {
        tenantId,
        startDate: { gte: from, lte: to },
        status: 'COMPLETED',
        isDeleted: false,
      },
    });
  }

  private async calcYearlyCustomers(tenantId: string, from: Date, to: Date) {
    return this.prisma.customer.count({
      where: { tenantId, createdAt: { gte: from, lte: to }, isDeleted: false },
    });
  }

  private async calcYearlyVehicleCount(tenantId: string, from: Date, to: Date) {
    return this.prisma.vehicle.count({
      where: { tenantId, createdAt: { lte: to }, isDeleted: false },
    });
  }

  private async calcAverageRentalDuration(
    tenantId: string,
    from: Date,
    to: Date,
  ) {
    const rentals = await this.prisma.rental.findMany({
      where: {
        tenantId,
        startDate: { gte: from },
        endDate: { lte: to },
        status: 'COMPLETED',
        isDeleted: false,
      },
      select: { startDate: true, endDate: true },
    });

    if (!rentals.length) return 0;

    const totalDays = rentals.reduce(
      (acc, r) =>
        acc +
        Math.ceil(
          (r.endDate.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      0,
    );
    return parseFloat((totalDays / rentals.length).toFixed(2));
  }

  private async runUnconfirmedRentalsCron() {
    try {
      const now = new Date();
      now.setMinutes(0, 0, 0);

      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);

      const tenants = await this.prisma.tenant.findMany();

      for (const tenant of tenants) {
        const rentals = await this.prisma.rental.findMany({
          where: {
            tenantId: tenant.id,
            status: 'PENDING',
            startDate: {
              gte: threeDaysFromNow,
              lt: new Date(threeDaysFromNow.getTime() + 60 * 60 * 1000),
            },
          },
        });

        for (const rental of rentals) {
          const primaryDriver = await this.prisma.rentalDriver.findFirst({
            where: {
              rentalId: rental.id,
              isPrimary: true,
            },
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          });

          const actionUrl = `/app/bookings`;
          const customerName = primaryDriver
            ? `${primaryDriver.customer.firstName} ${primaryDriver.customer.lastName}`
            : 'Unknown Customer';

          const message = `Booking #${rental.rentalNumber} by ${customerName} remains unconfirmed (2 days remaining)`;

          const notification = await this.prisma.tenantNotification.create({
            data: {
              tenantId: tenant.id,
              title: 'Unconfirmed Rental Alert',
              type: 'UNCONFIRMED',
              priority: 'MEDIUM',
              message,
              actionUrl,
              createdAt: new Date(),
            },
          });

          this.notificationService.sendTenantNotification(
            tenant.id,
            notification,
          );
        }
      }
    } catch (error) {
      console.error('Error in unconfirmedRentals:', error);
      throw error;
    }
  }

  private async runUpcomingRentalsCron() {
    try {
      const now = new Date();
      now.setMinutes(0, 0, 0);

      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(now.getDate() + 1);

      const tenants = await this.prisma.tenant.findMany();

      for (const tenant of tenants) {
        const rentals = await this.prisma.rental.findMany({
          where: {
            tenantId: tenant.id,
            status: {
              in: ['CONFIRMED', 'RESERVED'],
            },
            startDate: {
              gte: oneDayFromNow,
              lt: new Date(oneDayFromNow.getTime() + 60 * 60 * 1000),
            },
          },
          include: {
            vehicle: {
              include: {
                brand: true,
                model: true,
              },
            },
            pickup: true,
          },
        });

        for (const rental of rentals) {
          const primaryDriver = await this.prisma.rentalDriver.findFirst({
            where: {
              rentalId: rental.id,
              isPrimary: true,
            },
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          });

          const actionUrl = `/app/bookings`;
          const formattedTime = rental.startDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const customerName = primaryDriver
            ? `${primaryDriver.customer.firstName} ${primaryDriver.customer.lastName}`
            : 'Unknown Customer';
          const vehicleName =
            (rental.vehicle.brand?.brand ?? 'Unknown Brand') +
            ' ' +
            (rental.vehicle.model?.model ?? 'Unknown Model');
          const pickupLocation = rental.pickup?.location ?? 'Unknown Location';

          const message = `Reminder: ${customerName} pickup scheduled for tomorrow at ${formattedTime} - ${vehicleName} at ${pickupLocation}`;

          const notification = await this.prisma.tenantNotification.create({
            data: {
              tenantId: tenant.id,
              title: 'Vehicle Pickup',
              type: 'UPCOMING',
              priority: 'HIGH',
              message,
              actionUrl,
              createdAt: new Date(),
            },
          });

          this.notificationService.sendTenantNotification(
            tenant.id,
            notification,
          );
        }
      }
    } catch (error) {
      console.error('Error in upcomingRentals:', error);
      throw error;
    }
  }

  private async runUpcomingReturnsCron() {
    try {
      const now = new Date();
      now.setMinutes(0, 0, 0);

      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(now.getDate() + 1);

      const tenants = await this.prisma.tenant.findMany();

      for (const tenant of tenants) {
        const rentals = await this.prisma.rental.findMany({
          where: {
            tenantId: tenant.id,
            status: {
              in: ['ACTIVE'],
            },
            endDate: {
              gte: oneDayFromNow,
              lt: new Date(oneDayFromNow.getTime() + 60 * 60 * 1000),
            },
          },
          include: {
            vehicle: {
              include: {
                brand: true,
                model: true,
              },
            },
            return: true,
          },
        });

        for (const rental of rentals) {
          const primaryDriver = await this.prisma.rentalDriver.findFirst({
            where: {
              rentalId: rental.id,
              isPrimary: true,
            },
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          });

          const actionUrl = `/app/bookings`;
          const formattedTime = rental.startDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const customerName = primaryDriver
            ? `${primaryDriver.customer.firstName} ${primaryDriver.customer.lastName}`
            : 'Unknown Customer';
          const vehicleName =
            (rental.vehicle.brand?.brand ?? 'Unknown Brand') +
            ' ' +
            (rental.vehicle.model?.model ?? 'Unknown Model');
          const returnLocation = rental.return?.location ?? 'Unknown Location';

          const message = `Vehicle return  tomorrow: ${vehicleName} by ${customerName} to ${returnLocation} - ${formattedTime}`;

          const notification = await this.prisma.tenantNotification.create({
            data: {
              tenantId: tenant.id,
              title: 'Vehicle Return',
              type: 'RETURN',
              priority: 'MEDIUM',
              message,
              actionUrl,
              createdAt: new Date(),
            },
          });

          this.notificationService.sendTenantNotification(
            tenant.id,
            notification,
          );
        }
      }
    } catch (error) {
      console.error('Error in upcomingRentals:', error);
      throw error;
    }
  }
}
