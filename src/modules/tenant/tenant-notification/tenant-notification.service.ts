import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Tenant, User } from '../../../generated/prisma/client.js';
import { FormatterService } from '../../../common/formatter/formatter.service.js';
import { NotificationService } from '../../../common/notification/notification.service.js';

@Injectable()
export class TenantNotificationService {
  private readonly logger = new Logger(TenantNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly formatter: FormatterService,
    private readonly notificationService: NotificationService,
  ) {}

  async getTenantNotifications(tenant: Tenant, user: User) {
    try {
      const notifications = await this.prisma.tenantNotification.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          readByUsers: true,
        },
      });

      const notificationsWithReadStatus = await Promise.all(
        notifications.map(async (notification) => {
          const readStatus =
            await this.prisma.notificationReadStatus.findUnique({
              where: {
                notificationId_userId: {
                  notificationId: notification.id,
                  userId: user.id,
                },
              },
            });

          return {
            ...notification,
            isRead: !!readStatus,
          };
        }),
      );

      return notificationsWithReadStatus;
    } catch (error) {
      this.logger.error('Failed to get tenant notifications', error);
      throw error;
    }
  }

  async sendBookingNotification(bookingId: string, tenant: Tenant) {
    try {
      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId, tenantId: tenant.id },
        include: {
          vehicle: {
            include: {
              brand: true,
              model: true,
            },
          },
          drivers: {
            where: { isPrimary: true },
            include: {
              customer: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const bookingNumber = booking?.rentalNumber;
      const actionUrl = `/app/bookings/${bookingNumber}`;
      const driverName = booking.drivers[0]?.customer
        ? `${booking.drivers[0].customer.firstName} ${booking.drivers[0].customer.lastName}`
        : 'Valued Customer';
      const vehicleName = `${booking.vehicle.brand.brand} ${booking.vehicle.model.model}`;
      const fromDate = await this.formatter.formatDateToFriendlyDateShort(
        new Date(booking.startDate),
      );
      const toDate = await this.formatter.formatDateToFriendlyDateShort(
        new Date(booking.endDate),
      );
      const message = `${driverName} just submitted a booking request for a ${vehicleName}, scheduled from ${fromDate} to ${toDate}, via your storefront.`;

      const notification = await this.prisma.tenantNotification.create({
        data: {
          tenantId: tenant.id,
          title: 'New Booking Request',
          type: 'BOOKING',
          priority: 'HIGH',
          message,
          actionUrl,
          createdAt: new Date(),
        },
      });

      this.notificationService.sendTenantNotification(tenant.id, notification);
    } catch (error) {
      this.logger.error('Failed to send booking notification', error);
      throw error;
    }
  }

  async markNotificationAsRead(
    notificationId: string,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const notification = await this.prisma.tenantNotification.findUnique({
        where: { id: notificationId, tenantId: tenant.id },
      });

      if (!notification) {
        this.logger.warn('Notification not found', {
          notificationId,
          tenantId: tenant.id,
        });
        throw new NotFoundException('Notification not found');
      }

      await this.prisma.notificationReadStatus.upsert({
        where: {
          notificationId_userId: {
            notificationId: notificationId,
            userId: user.id,
          },
        },
        create: {
          notificationId: notification.id,
          userId: user.id,
        },
        update: {},
      });

      const allNotifications = await this.getTenantNotifications(tenant, user);

      return {
        message: 'Notification marked as read successfully',
        notifications: allNotifications,
      };
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(tenant: Tenant, user: User) {
    try {
      const notifications = await this.prisma.tenantNotification.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
      });

      const readStatusPromises = notifications.map((notification) =>
        this.prisma.notificationReadStatus.upsert({
          where: {
            notificationId_userId: {
              notificationId: notification.id,
              userId: user.id,
            },
          },
          create: {
            notificationId: notification.id,
            userId: user.id,
          },
          update: {},
        }),
      );

      await Promise.all(readStatusPromises);

      const allNotifications = await this.getTenantNotifications(tenant, user);

      return {
        message: 'All notifications marked as read successfully',
        notifications: allNotifications,
      };
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, tenant: Tenant, user: User) {
    try {
      const notification = await this.prisma.tenantNotification.findUnique({
        where: { id: notificationId, tenantId: tenant.id },
      });

      if (!notification) {
        this.logger.warn('Notification not found for deletion', {
          notificationId,
          tenantId: tenant.id,
        });
        throw new NotFoundException('Notification not found');
      }

      await this.prisma.tenantNotification.update({
        where: { id: notificationId, tenantId: tenant.id },
        data: { isDeleted: true },
      });

      const allNotifications = await this.getTenantNotifications(tenant, user);

      return {
        message: 'Notification deleted successfully',
        notifications: allNotifications,
      };
    } catch (error) {
      this.logger.error('Failed to delete notification', error);
      throw error;
    }
  }
}
