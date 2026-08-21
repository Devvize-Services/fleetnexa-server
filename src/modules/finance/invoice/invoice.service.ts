import { Injectable, Logger } from '@nestjs/common';
import { CustomerService } from '../../../modules/customer/customer.service';
import { NotFoundException } from '@nestjs/common';
import { GeneratorService } from '../../../common/generator/generator.service';
import { PdfService } from '../../../common/pdf/pdf.service';
import { Tenant, User } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { InvoiceData, InvoiceItem, RentalService } from '../../../types/pdf';
import { format, toZonedTime } from 'date-fns-tz';
import { FormatterService } from '../../../common/formatter/formatter.service';
import { TenantExtraService } from '../../../modules/tenant/tenant-extra/tenant-extra.service';
import { AwsService } from '../../../infrastructure/aws/aws.service';
import { randomBytes } from 'crypto';
import { ActivityService } from '../../../common/activity/activity.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
    private readonly pdfService: PdfService,
    private readonly customerService: CustomerService,
    private readonly formatter: FormatterService,
    private readonly tenantExtraService: TenantExtraService,
    private readonly awsService: AwsService,
    private readonly activityService: ActivityService,
  ) {}

  async getInvoices(tenant: Tenant) {
    try {
      const invoices = await this.prisma.invoice.findMany({
        where: { tenantId: tenant.id },
        include: {
          booking: {
            select: {
              id: true,
              bookingCode: true,
              rentalNumber: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      return invoices;
    } catch (error: any) {
      this.logger.error(error, 'Failed to retrieve invoices', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getInvoiceByToken(accessToken: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { accessToken },
      });

      if (!invoice) {
        this.logger.warn('Invoice not found for access token', { accessToken });
        throw new NotFoundException('Invoice not found');
      }

      const url = new URL(invoice.invoiceUrl!);

      const key = decodeURIComponent(url.pathname.substring(1));

      const signedUrl = await this.awsService.getSignedDownloadUrl(key);

      return signedUrl;
    } catch (error: any) {
      this.logger.error(error, 'Failed to retrieve invoice by token', {
        accessToken,
      });
      throw error;
    }
  }

  async getInvoiceById(id: string, tenant: Tenant) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.tenantId !== tenant.id) {
        throw new NotFoundException('Invoice not found for this tenant');
      }

      return invoice;
    } catch (error: any) {
      this.logger.error(error, 'Failed to retrieve invoice', {
        invoiceId: id,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async generateInvoice(
    bookingId: string,
    tenant: Tenant,
    user: User,
    res?: any,
  ) {
    try {
      let invoiceNumber;

      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
        include: { values: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const existingInvoice = await this.prisma.invoice.findUnique({
        where: { rentalId: bookingId },
      });

      if (existingInvoice) {
        invoiceNumber = existingInvoice.invoiceNumber;
      } else {
        invoiceNumber = await this.generator.generateInvoiceNumber(tenant.id);
      }

      const data = await this.generateInvoiceData(bookingId, tenant.id);

      data.invoiceNumber = invoiceNumber;
      const pdfResult = await this.pdfService.createInvoice(
        data,
        invoiceNumber,
        tenant.tenantCode,
      );

      const primaryDriver =
        await this.customerService.getPrimaryDriver(bookingId);

      if (!primaryDriver) {
        throw new NotFoundException('Primary driver not found');
      }

      const accessToken = randomBytes(32).toString('hex');

      const invoice = await this.prisma.invoice.upsert({
        where: { rentalId: bookingId },
        create: {
          invoiceNumber,
          amount: booking?.values?.netTotal || 0,
          customerId: primaryDriver?.driverId || '',
          rentalId: booking?.id || '',
          tenantId: tenant.id!,
          createdAt: new Date(),
          createdBy: user.username,
          invoiceUrl: pdfResult.publicUrl,
          invoiceDate: booking.startDate,
          accessToken,
        },
        update: {
          amount: booking?.values?.netTotal || 0,
          customerId: primaryDriver?.driverId || '',
          tenantId: tenant.id!,
          invoiceUrl: pdfResult.publicUrl,
          invoiceDate: booking.startDate,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      this.logger.log(
        `Invoice ${invoice.invoiceNumber} ${existingInvoice ? 'regenerated' : 'generated'} for booking ${booking.bookingCode}`,
      );

      await this.activityService.logEvent({
        action: 'UPDATE',
        module: 'INVOICE',
        entityId: invoice.id,
        entityType: 'Invoice',
        userId: user.id,
        description: `Invoice ${invoice.invoiceNumber} ${existingInvoice ? 'regenerated' : 'generated'} for booking ${booking.bookingCode}`,
        tenantId: tenant.id,
        oldValues: existingInvoice ? { ...existingInvoice } : {},
        newValues: { ...invoice },
        ipAddress: res?.ip || '',
        userAgent: res?.headers?.['user-agent'] || '',
      });

      return {
        message: 'Invoice generated successfully',
        invoice,
        invoices: await this.getInvoices(tenant),
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to generate invoice', {
        bookingId,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async generateInvoiceData(bookingId: string, tenantId: string) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          currency: true,
          address: {
            include: { village: true, state: true, country: true },
          },
        },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const tenantExtras =
        await this.tenantExtraService.getTenantExtras(tenant);

      const getExtra = (id: string) => ({
        ...tenantExtras?.find((extra) => extra.id === id),
      });

      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            include: {
              brand: true,
              model: true,
            },
          },
          return: true,
          pickup: true,
          chargeType: true,
          values: {
            include: { extras: true },
          },
          drivers: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const primaryDriver =
        await this.customerService.getPrimaryDriver(bookingId);

      const customerAddress = primaryDriver?.customer?.address
        ? [
            primaryDriver.customer.address.village?.village,
            primaryDriver.customer.address.state?.state,
            primaryDriver.customer.address.country?.country,
          ]
            .filter(Boolean)
            .join(', ')
        : 'No Address Provided';

      const services: RentalService[] = (booking?.values?.extras || []).map(
        (item) => {
          const extraItem = getExtra(item.extraId!);
          const cost = booking?.values?.extras?.find(
            (el) => el.extraId === extraItem?.id,
          )?.amount;

          return {
            label: extraItem?.name || '',
            description:
              typeof extraItem?.description === 'string'
                ? extraItem.description
                : '',
            amount: parseFloat((cost || 0).toFixed(2)),
          };
        },
      );

      const returnItem: InvoiceItem = {
        label: 'Return Fee',
        amount: parseFloat((booking?.return?.collectionFee || 0).toFixed(2)),
        description: `Car Pickup at ${booking?.return?.location || ''}`,
      };

      const pickupItem: InvoiceItem = {
        label: 'Pickup Fee',
        amount: parseFloat((booking?.pickup?.deliveryFee || 0).toFixed(2)),
        description: `Car Delivery to ${booking?.pickup?.location || ''}`,
      };

      const additionalDriverItem: InvoiceItem = {
        label: 'Additional Driver Fee',
        amount: parseFloat(
          (booking?.values?.additionalDriverFees || 0).toFixed(2),
        ),
        description: `Additional Driver Fee for ${
          (booking?.drivers?.length || 1) - 1
        } driver(s)`,
      };

      const filteredServices = [
        ...services.filter((item) => item.amount !== 0),
        ...(pickupItem.amount !== 0 ? [pickupItem] : []),
        ...(returnItem.amount !== 0 ? [returnItem] : []),
        ...(additionalDriverItem.amount !== 0 ? [additionalDriverItem] : []),
      ];

      const unitPlural = () => {
        switch (booking?.chargeType?.unit) {
          case 'day': {
            const days = booking?.values?.numberOfDays ?? 0;
            return `day${days > 1 ? 's' : ''}`;
          }
          case 'week': {
            const weeks = Math.ceil((booking?.values?.numberOfDays ?? 0) / 7);
            return `week${weeks > 1 ? 's' : ''}`;
          }
          case 'month': {
            const months = Math.ceil((booking?.values?.numberOfDays ?? 0) / 30);
            return `month${months > 1 ? 's' : ''}`;
          }
          default:
            return 'days';
        }
      };

      const numberOfUnits = () => {
        switch (booking?.chargeType?.unit) {
          case 'day':
            return booking?.values?.numberOfDays ?? 0;
          case 'week':
            return Math.ceil((booking?.values?.numberOfDays ?? 0) / 7);
          case 'month':
            return Math.ceil((booking?.values?.numberOfDays ?? 0) / 30);
          default:
            return booking?.values?.numberOfDays;
        }
      };
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

      const data: InvoiceData = {
        companyName: tenant?.tenantName || '',
        streetAddress: tenant?.address?.street || '',
        city: tenant?.address?.village?.village || '',
        state: tenant?.address?.state?.state || '',
        country: tenant?.address?.country?.country || '',
        email: tenant?.email || '',
        phone: tenant?.number || '',
        logoUrl: tenant?.logo || '',
        customerName: `${primaryDriver?.customer?.firstName} ${primaryDriver?.customer?.lastName}`,
        customerAddress: customerAddress,
        customerEmail: primaryDriver?.customer?.email || '',
        customerPhone: primaryDriver?.customer?.phone || '',
        invoiceNumber: '',
        issuedDate: `${await this.formatter.formatDate(new Date())}`,
        dueDate: `${await this.formatter.formatDate(booking?.startDate)}`,
        numberOfUnits: numberOfUnits() || 0,
        unitPlural: unitPlural(),
        unit: booking?.chargeType?.unit?.toString() || '',
        basePrice: parseFloat((booking?.values?.basePrice || 0).toFixed(2)),
        make: booking?.vehicle?.brand?.brand || '',
        model: booking?.vehicle?.model?.model || '',
        year: booking?.vehicle?.year || 0,
        color: booking?.vehicle?.color || '',
        licensePlate: booking?.vehicle?.licensePlate || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        pickupLocation: booking?.pickup?.location || '',
        returnLocation: booking?.return?.location || '',
        rentalAmount: parseFloat((booking?.values?.totalCost || 0).toFixed(2)),
        subTotal: parseFloat((booking?.values?.subTotal || 0).toFixed(2)),
        total: parseFloat((booking?.values?.netTotal || 0).toFixed(2)),
        discount: parseFloat((booking?.values?.discount || 0).toFixed(2)),
        invoiceNotes: tenant?.invoiceFootNotes || '',
        services: filteredServices,
        currency: tenant?.currency?.code || 'XCD',
      };

      return data;
    } catch (error: any) {
      this.logger.error(error, 'Failed to generate invoice data', {
        bookingId,
        tenantId,
      });
      throw new Error('Failed to generate invoice data');
    }
  }
}
