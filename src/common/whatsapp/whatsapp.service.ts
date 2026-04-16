import { Global, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotifyService } from '../notify/notify.service.js';
import { SendWhatsAppDto } from '../notify/dto/send-whatsapp.dto.js';
import { CustomerService } from '../../modules/customer/customer.service.js';
import { format, toZonedTime } from 'date-fns-tz';

@Global()
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
    private readonly customer: CustomerService,
  ) {}

  async sendBookingDocuments(data: SendWhatsAppDto) {
    try {
      await this.notify.sendWhatsapp(data);
    } catch (error) {
      this.logger.error(error, 'Failed to send booking documents', {
        data,
      });
      throw error;
    }
  }

  async sendBookingNotification(bookingId: string) {
    try {
      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
        select: {
          bookingCode: true,
          tenant: true,
          startDate: true,
          endDate: true,
          vehicle: {
            select: {
              brand: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
      });

      const primaryDriver = await this.customer.getPrimaryDriver(bookingId);

      const vehicle = `${booking?.vehicle.year} ${booking?.vehicle.brand.brand} ${booking?.vehicle.model.model} (${booking?.vehicle.licensePlate})`;
      const customer = `${primaryDriver?.customer.firstName} ${primaryDriver?.customer.lastName}`;

      const localStartDate = booking?.startDate
        ? toZonedTime(booking.startDate, 'America/Dominica')
        : '';

      const formattedStartDate = format(
        localStartDate,
        'EEE, MMM d, yyyy hh:mm aa',
      );

      const localEndDate = booking?.endDate
        ? toZonedTime(booking.endDate, 'America/Dominica')
        : '';
      const formattedEndDate = format(
        localEndDate,
        'EEE, MMM d, yyyy hh:mm aa',
      );

      const payload: SendWhatsAppDto = {
        recipient: booking?.tenant.whatsappNumber || '',
        message: `New Booking Request\n${customer} just submitted a booking request for  ${vehicle}, scheduled from ${formattedStartDate} to ${formattedEndDate}, via your storefront. `,
      };

      await this.notify.sendWhatsapp(payload);
    } catch (error) {
      this.logger.error(error, 'Failed to send WhatsApp booking notification', {
        bookingId,
      });
      throw error;
    }
  }
}
