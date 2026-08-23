import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Tenant, User } from '../../generated/prisma/client.js';
import { GeneratorService } from '../../common/generator/generator.service.js';
import { TenantExtraService } from '../tenant/tenant-extra/tenant-extra.service.js';
import { CustomerService } from '../customer/customer.service.js';
import {
  InvoiceItem,
  RentalAgreementData,
  RentalAgreementDriver,
  RentalService,
} from '../../types/pdf.js';
import { format, toZonedTime } from 'date-fns-tz';
import { FormatterService } from '../../common/formatter/formatter.service.js';
import { FirmaService } from '../../infrastructure/firma/firma.service.js';
import { SendForSigningDto } from './dto/send-for-signing.dto.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { PdfMonkeyService } from '../../infrastructure/pdfMonkey/pdf.service.js';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
    private readonly formatter: FormatterService,
    private readonly tenantExtraService: TenantExtraService,
    private readonly customerService: CustomerService,
    private readonly pdfMonkey: PdfMonkeyService,
    private readonly firma: FirmaService,
  ) {}

  async generateAgreement(bookingId: string, tenant: Tenant, user: User) {
    try {
      let agreementNumber;

      const booking = await this.prisma.rental.findUnique({
        where: { id: bookingId },
        include: { values: true },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const existingAgreement = await this.prisma.rentalAgreement.findUnique({
        where: { rentalId: bookingId },
      });

      if (existingAgreement) {
        agreementNumber = existingAgreement.number;
      } else {
        agreementNumber = await this.generator.generateRentalAgreementNumber(
          tenant.id!,
        );
      }

      const data = await this.generateAgreementData(bookingId, tenant.id);

      data.agreementNumber = agreementNumber;
      const pdfResult = await this.pdfMonkey.createAgreement(
        data,
        agreementNumber,
        tenant.tenantCode,
      );

      const primaryDriver =
        await this.customerService.getPrimaryDriver(bookingId);

      if (!primaryDriver) {
        throw new NotFoundException('Primary driver not found');
      }

      const agreement = await this.prisma.rentalAgreement.upsert({
        where: { rentalId: bookingId },
        create: {
          number: agreementNumber,
          customerId: primaryDriver?.driverId || '',
          rentalId: bookingId,
          tenantId: tenant.id,
          createdAt: new Date(),
          createdBy: user.username,
          agreementUrl: pdfResult.publicUrl,
          signableUrl: pdfResult.signablePublicUrl,
        },
        update: {
          customerId: primaryDriver?.driverId || '',
          tenantId: tenant.id,
          agreementUrl: pdfResult.publicUrl,
          signableUrl: pdfResult.signablePublicUrl,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      return {
        message: 'Agreement generated successfully',
        agreement,
      };
    } catch (error: any) {
      this.logger.error(error, 'Failed to generate agreement', {
        bookingId,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw new Error('Failed to generate agreement');
    }
  }

  async sendAgreementForSignature(data: SendForSigningDto, tenant: Tenant) {
    try {
      const res = await this.firma.sendForSigning(data, tenant);

      return res;
    } catch (error: any) {
      this.logger.error(error, 'Failed to send agreement for signature', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw new Error('Failed to send agreement for signature');
    }
  }

  async generateAgreementData(bookingId: string, tenantId: string) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          currency: true,
          cancellationPolicy: true,
          latePolicy: true,
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
              transmission: true,
              fuelType: true,
              wheelDrive: true,
              model: {
                include: {
                  bodyType: true,
                },
              },
            },
          },
          return: true,
          pickup: true,
          chargeType: true,
          values: {
            include: { extras: true },
          },
          drivers: {
            include: {
              customer: {
                include: {
                  address: {
                    include: {
                      village: true,
                      state: true,
                      country: true,
                    },
                  },
                  license: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const pricePolicy = (policy: string) => {
        switch (policy) {
          case 'FLAT_RATE':
            return '/day';
          case 'FIXED_AMOUNT':
            return '';
          case 'PERCENTAGE':
            return '% of total';
        }
      };

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
            rate: extraItem?.price || 0,
            policy: pricePolicy(
              typeof extraItem?.pricePolicy === 'string'
                ? extraItem.pricePolicy
                : '',
            ),
          };
        },
      );

      const returnItem: InvoiceItem = {
        label: 'Return Fee',
        amount: parseFloat((booking?.return?.collectionFee || 0).toFixed(2)),
        rate: booking?.return?.collectionFee || 0,
      };

      const additionalDriverItem: InvoiceItem = {
        label: 'Additional Driver Fee',
        amount: parseFloat(
          (booking?.values?.additionalDriverFees || 0).toFixed(2),
        ),
        rate: tenant?.additionalDriverFee || 0,
      };

      const pickupItem: InvoiceItem = {
        label: 'Pickup Fee',
        amount: parseFloat((booking?.pickup?.deliveryFee || 0).toFixed(2)),
        rate: booking?.pickup?.deliveryFee || 0,
      };

      const extrasTotal = services.reduce(
        (acc, item) => acc + (item.amount || 0),
        0,
      );

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

      const getPolicyText = (policy: string) => {
        switch (policy) {
          case 'percent':
            return `${
              tenant?.cancellationPolicy?.amount ?? 0
            }% of the total booking amount`;
          case 'fixed_amount':
            return `${this.formatter.formatCurrencyWithCode(
              tenant.currency?.code || 'USD',
              tenant?.cancellationPolicy?.amount ?? 0,
            )}`;
          default:
            return `${this.formatter.formatCurrencyWithCode(
              tenant.currency?.code || 'USD',
              tenant?.cancellationPolicy?.amount ?? 0,
            )}`;
        }
      };

      const drivers: RentalAgreementDriver[] = (booking?.drivers || []).map(
        (el) => ({
          firstName: el.customer?.firstName || '',
          lastName: el.customer?.lastName || '',
          dateOfBirth: this.formatter.formatDateToFriendly(
            el.customer?.dateOfBirth || '',
          ),
          licenseNumber: el.customer?.license?.licenseNumber || '',
          license: el.customer?.license?.licenseNumber || '',
          email: el.customer?.email || '',
          phone: el.customer?.phone || '',
          address: el.customer?.address?.street || '',
          issuedDate: this.formatter.formatDateToFriendly(
            el.customer?.license?.licenseIssued || '',
          ),
          expiryDate: this.formatter.formatDateToFriendly(
            el.customer?.license?.licenseExpiry || '',
          ),
          city: el.customer?.address?.village?.village || '',
          country: el.customer?.address?.country?.country || '',
          primaryDriver: el.isPrimary || false,
        }),
      );

      const localStartDate = booking?.startDate
        ? toZonedTime(booking.startDate, 'America/Dominica')
        : '';
      const localStartTime = format(localStartDate, 'hh:mm aa');

      const localEndDate = booking?.endDate
        ? toZonedTime(booking.endDate, 'America/Dominica')
        : '';
      const localEndTime = format(localEndDate, 'hh:mm aa');

      const data: RentalAgreementData = {
        tenantName: tenant?.tenantName || '',
        street: tenant?.address?.street || '',
        village: tenant?.address?.village?.village || '',
        parish: tenant?.address?.state?.state || '',
        country: tenant?.address?.country?.country || '',
        email: tenant?.email || '',
        phone: tenant?.number || '',
        agreementNumber: '',
        agreementDate: await this.formatter.formatDate(new Date()),
        make: booking?.vehicle?.brand?.brand || '',
        model: booking?.vehicle?.model?.model || '',
        plate: booking?.vehicle?.licensePlate || '',
        bodyType: booking?.vehicle.model?.bodyType?.bodyType || '',
        transmission: booking?.vehicle?.transmission?.transmission || '',
        color: booking?.vehicle?.color || '',
        year: booking?.vehicle?.year || 0,
        fuelPercent: `${booking?.vehicle?.fuelLevel}%`,
        mileage:
          (await this.formatter.formatMilage(
            booking?.vehicle?.odometer || 0,
          )) || '',
        fuel: booking?.vehicle?.fuelType?.fuel || '',
        drive: booking?.vehicle?.wheelDrive?.drive || '',
        featuredImage: booking?.vehicle?.featuredImage || '',
        pickupDate: `${this.formatter.formatDateToFriendly(booking?.startDate || '')}`,
        pickupLocation: booking?.pickup?.location || '',
        pickupTime: `${localStartTime}`,
        returnDate: `${this.formatter.formatDateToFriendly(booking?.endDate || '')}`,
        returnLocation: booking?.return?.location || '',
        returnTime: `${localEndTime}`,
        drivers,
        numberOfUnits: numberOfUnits() || 0,
        unit: booking?.chargeType?.unit?.toString() || 'day',
        unitPlural: unitPlural(),
        basePrice: parseFloat((booking?.values?.basePrice || 0).toFixed(2)),
        rentalAmount: parseFloat((booking?.values?.totalCost || 0).toFixed(2)),
        services: filteredServices,
        extrasTotal: parseFloat(
          (extrasTotal + pickupItem.amount + returnItem.amount).toFixed(2),
        ),
        securityDeposit: parseFloat((booking?.values?.deposit || 0).toFixed(2)),
        total: parseFloat((booking?.values?.netTotal || 0).toFixed(2)),
        currency: tenant?.currency?.code || 'USD',
        minimumDays: tenant?.cancellationPolicy?.minimumDays || 0,
        bookingMinimumDays: tenant?.cancellationPolicy?.bookingMinimumDays || 0,
        cancellationText: getPolicyText(
          tenant?.cancellationPolicy?.policy || 'fixed_amount',
        ),
        discount: booking?.values?.discount || 0,
        lateAmount: tenant?.latePolicy?.amount ?? 0,
        maxHours: tenant?.latePolicy?.maxHours || 0,
        dailyRate: parseFloat((booking?.vehicle?.dayPrice || 0).toFixed(2)),
      };

      return data;
    } catch (error: any) {
      this.logger.error(error, 'Failed to generate agreement data', {
        tenantId,
        bookingId,
      });
      throw new Error('Failed to generate agreement data');
    }
  }
}
