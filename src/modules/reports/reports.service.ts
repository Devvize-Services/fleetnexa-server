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

      return {
        revenue,
        paymentsReceived,
        expenses,
        ...bookingStats,
        ...fleetStats,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard stats', error);
      throw error;
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

    const totalBookingOutstanding = totalBookingValues - totalBookingPayments;

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
