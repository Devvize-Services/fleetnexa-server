import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Tenant } from '../../generated/prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(tenant: Tenant) {
    try {
      const revenue = await this.calcRevenue(tenant.id);
      const paymentsReceived = await this.calcPaymentsReceived(tenant.id);
      const expenses = await this.calcExpenses(tenant.id);

      const bookingStats = await this.getBookingCount(tenant.id);
      const fleetStats = await this.getFleetStats(tenant.id);

      const revenueData = await this.getRevenueStats(tenant);

      return {
        revenue,
        paymentsReceived,
        expenses,
        ...bookingStats,
        ...fleetStats,
        revenueData,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard stats', error);
      throw error;
    }
  }

  async getRevenueStats(tenant: Tenant) {
    try {
      const bookings = await this.prisma.rental.findMany({
        where: {
          tenantId: tenant.id,
          isDeleted: false,
          status: { notIn: ['PENDING', 'CANCELED', 'DECLINED'] },
        },
        include: {
          values: true,
        },
      });

      const payments = await this.prisma.payment.findMany({
        where: {
          tenantId: tenant.id,
          isDeleted: false,
          status: 'COMPLETED',
        },
      });

      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          tenantId: tenant.id,
        },
      });

      const revenueByVehicle: { label: string; value: number }[] = [];
      const revenueBySource: { label: string; value: number }[] = [];
      const revenueByMonth: { label: string; value: number }[] = [];

      const revenue = await this.calcRevenue(tenant.id);
      const discounts = bookings.reduce((sum, booking) => {
        return sum + (booking.values?.discount ?? 0);
      }, 0);
      const totalPayments = payments.reduce((sum, payment) => {
        return sum + payment.amount;
      }, 0);
      const outstanding = Math.max(0, revenue - totalPayments - discounts);

      for (const vehicle of vehicles) {
        revenueByVehicle.push({
          label: vehicle.id,
          value: bookings
            .filter((booking) => booking.vehicleId === vehicle.id)
            .reduce((sum, booking) => sum + (booking.values?.netTotal ?? 0), 0),
        });
      }
      revenueByVehicle.sort((first, second) => second.value - first.value);
      revenueByVehicle.splice(5);

      for (const booking of bookings) {
        const bookingRevenue = booking.values?.netTotal ?? 0;
        const source = booking.agent ?? 'UNKNOWN';
        const month = booking.startDate.toISOString().slice(0, 7);

        const sourceIndex = revenueBySource.findIndex(
          (item) => item.label === source,
        );
        if (sourceIndex >= 0) {
          revenueBySource[sourceIndex].value += bookingRevenue;
        } else {
          revenueBySource.push({ label: source, value: bookingRevenue });
        }
        const monthIndex = revenueByMonth.findIndex(
          (item) => item.label === month,
        );
        if (monthIndex >= 0) {
          revenueByMonth[monthIndex].value += bookingRevenue;
        } else {
          revenueByMonth.push({ label: month, value: bookingRevenue });
        }
      }

      const monthlyRevenue = new Map(
        revenueByMonth.map((item) => [item.label, item.value]),
      );
      const now = new Date();
      const lastFiveMonths = Array.from({ length: 5 }, (_, index) => {
        const month = new Date(
          now.getFullYear(),
          now.getMonth() - 4 + index,
          1,
        );
        return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      });
      const recentRevenueByMonth = lastFiveMonths.map((month) => ({
        label: month,
        value: monthlyRevenue.get(month) ?? 0,
      }));

      return {
        revenue,
        discounts,
        totalPayments,
        outstanding,
        revenueByVehicle,
        revenueBySource,
        revenueByMonth: recentRevenueByMonth,
      };
    } catch (error) {
      this.logger.error('Failed to get revenue stats', error);
    }
  }

  private async getBookingCount(tenantId: string) {
    const now = new Date();
    const currentMonth = now.getMonth();

    const bookings = await this.prisma.rental.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        values: true,
        payments: true,
      },
    });

    const calcuableBookings = bookings.filter(
      (booking) =>
        !['PENDING', 'CANCELLED', 'DECLINED'].includes(booking.status),
    );

    const active = bookings.filter((booking) => booking.status === 'ACTIVE');
    const upcomingPickups = bookings.filter(
      (booking) =>
        booking.status === 'CONFIRMED' && booking.startDate > new Date(),
    );
    const upcomingReturns = bookings.filter(
      (booking) => booking.status === 'ACTIVE',
    );
    const bookingsThisMonth = bookings.filter(
      (booking) =>
        booking.startDate.getMonth() === currentMonth &&
        booking.startDate.getFullYear() === now.getFullYear(),
    );

    const totalBookingValues = calcuableBookings.reduce((sum, booking) => {
      return sum + (booking.values?.netTotal ?? 0);
    }, 0);

    const totalBookingPayments = calcuableBookings.reduce((sum, booking) => {
      return (
        sum +
        (booking.payments?.reduce(
          (paymentSum, payment) => paymentSum + (payment.amount ?? 0),
          0,
        ) ?? 0)
      );
    }, 0);

    const totalBookingOutstanding = Math.max(
      0,
      totalBookingValues - totalBookingPayments,
    );

    return {
      active: active.length,
      upcomingPickups: upcomingPickups.length,
      upcomingReturns: upcomingReturns.length,
      bookingsThisMonth: bookingsThisMonth.length,
      outstanding: totalBookingOutstanding,
    };
  }

  private async getFleetStats(tenantId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
    });

    const statuses = await this.prisma.vehicleStatus.findMany({});

    const totalVehicles = vehicles.length;

    const availableStatus = statuses.find(
      (status) => status.status.toLowerCase() === 'available',
    );
    const rentedStatus = statuses.find(
      (status) => status.status.toLowerCase() === 'rented',
    );
    const maintenanceStatus = statuses.find(
      (status) => status.status.toLowerCase() === 'under maintenance',
    );

    const availableVehicles = vehicles.filter(
      (vehicle) => vehicle.vehicleStatusId === availableStatus?.id,
    ).length;
    const rentedVehicles = vehicles.filter(
      (vehicle) => vehicle.vehicleStatusId === rentedStatus?.id,
    ).length;
    const maintenanceVehicles = vehicles.filter(
      (vehicle) => vehicle.vehicleStatusId === maintenanceStatus?.id,
    ).length;

    return {
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
    };
  }

  private async calcPaymentsReceived(tenantId: string) {
    const { _sum: payments } = await this.prisma.transactions.aggregate({
      where: {
        type: 'PAYMENT',
        rental: {
          tenantId,
          status: 'COMPLETED',
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });

    return payments.amount ?? 0;
  }

  private async calcRevenue(tenantId: string) {
    const { _sum: payments } = await this.prisma.transactions.aggregate({
      where: {
        type: 'PAYMENT',
        rental: {
          tenantId,
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
          status: 'COMPLETED',
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });
    return (payments.amount ?? 0) - (refunds.amount ?? 0);
  }

  private async calcExpenses(tenantId: string) {
    const { _sum: expenses } = await this.prisma.expense.aggregate({
      where: {
        tenantId,
        isDeleted: false,
      },
      _sum: { amount: true },
    });
    return expenses.amount ?? 0;
  }
}
