import { Global, Injectable, Logger } from '@nestjs/common';
import slug from 'slug';
import { PrismaService } from '../../prisma/prisma.service.js';
import crypto from 'crypto';

@Global()
@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateTenantCode(tenantName: string): Promise<string> {
    const initials = tenantName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('');

    const existingTenants = await this.prisma.tenant.findMany({
      where: {
        tenantCode: {
          startsWith: initials,
        },
      },
      select: {
        tenantCode: true,
      },
    });

    const seriesNumbers = existingTenants.map((t) => {
      const parts = t.tenantCode.split('-');
      return parts[1] ? parseInt(parts[1], 10) : 0;
    });

    const nextSeriesNumber =
      seriesNumbers.length > 0 ? Math.max(...seriesNumbers) + 1 : 1;

    return `${initials}-${nextSeriesNumber.toString().padStart(3, '0')}`;
  }

  async generateTenantSlug(tenantName: string): Promise<string> {
    let tenantSlug = '';
    tenantSlug = slug(tenantName);

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (existingTenant) {
      const uniqueSuffix = Date.now();
      tenantSlug = `${tenantSlug}-${uniqueSuffix}`;
    }

    return tenantSlug;
  }

  async generateUsername(firstName: string, lastName: string): Promise<string> {
    try {
      const cleanFirst = firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanLast = lastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      let attempt = 1;
      let username = '';

      while (true) {
        const prefix = cleanFirst.substring(0, attempt);
        username = `${prefix}${cleanLast}`;

        const existingUser = await this.prisma.user.findUnique({
          where: { username },
        });

        if (!existingUser) {
          return username;
        }

        attempt++;

        if (attempt > cleanFirst.length) {
          const randomNumber = Math.floor(1000 + Math.random() * 9000);
          username = `${cleanFirst[0]}${cleanLast}${randomNumber}`;
          return username;
        }
      }
    } catch (error) {
      this.logger.error('Failed to generate username', error);
      throw error;
    }
  }

  async generateInvoiceNumber(tenantId: string): Promise<string> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { invoiceSequence: true },
      });

      if (!tenant?.invoiceSequence) {
        throw new Error('Tenant has no invoice sequence configured');
      }

      const lastInvoice = await this.prisma.invoice.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      });

      const lastNumber = lastInvoice?.invoiceNumber
        ? parseInt(lastInvoice.invoiceNumber.match(/\d+$/)?.[0] || '0', 10)
        : 0;
      const nextNumber = lastNumber + 1;

      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');

      let prefix = tenant.invoiceSequence.prefix;
      prefix = prefix
        .replace(/{year}/g, year)
        .replace(/{month}/g, month)
        .replace(/{day}/g, day)
        .replace(/{tenantId}/g, tenantId.substring(0, 4));

      const sequenceNumber = nextNumber.toString().padStart(3, '0');

      return `${prefix}${sequenceNumber}`;
    } catch (error) {
      this.logger.error('Failed to generate invoice number', error);
      throw error;
    }
  }

  async generateBookingNumber(tenantId: string): Promise<string> {
    try {
      const lastRental = await this.prisma.rental.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { rentalNumber: true },
      });

      if (!lastRental || !lastRental.rentalNumber) {
        return '000001';
      }

      const lastNumber = parseInt(lastRental.rentalNumber, 10);
      const nextNumber = lastNumber + 1;

      return nextNumber.toString().padStart(6, '0');
    } catch (error) {
      this.logger.error('Failed to generate rental number', error);
      throw error;
    }
  }

  async generateBookingCode(
    tenantCode: string,
    rentalNumber: string,
  ): Promise<string> {
    const cleanedTenantCode = tenantCode.replace(/-/g, '');

    const paddedRentalNumber = rentalNumber.padStart(6, '0');

    return `${cleanedTenantCode}-${paddedRentalNumber}`;
  }

  async generateRentalAgreementNumber(tenantId: string): Promise<string> {
    const lastAgreement = await this.prisma.rentalAgreement.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const currentYear = new Date().getFullYear().toString();
    let sequenceNumber = 1;

    if (lastAgreement?.number) {
      const match = lastAgreement.number.match(/BA-\d{4}-(\d{4})/);
      if (match && match[1]) {
        sequenceNumber = parseInt(match[1], 10) + 1;
      }
    }

    const formattedSequence = sequenceNumber.toString().padStart(4, '0');

    return `BA-${currentYear}-${formattedSequence}`;
  }

  async generatePaymentReceiptNumber(tenantId: string): Promise<string> {
    try {
      const prefix = 'RCPT';
      const lastReceipt = await this.prisma.paymentReceipt.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { receiptNumber: true },
      });

      const lastNumber = lastReceipt?.receiptNumber
        ? parseInt(lastReceipt.receiptNumber.match(/\d+$/)?.[0] || '0', 10)
        : 0;
      const nextNumber = lastNumber + 1;

      const sequenceNumber = nextNumber.toString().padStart(6, '0');

      return `${prefix}-${sequenceNumber}`;
    } catch (error) {
      this.logger.error('Failed to generate payment receipt number', error);
      throw error;
    }
  }

  async generateTransactionNumber(tenantId: string): Promise<string> {
    try {
      const prefix = 'TXN';
      const lastTransaction = await this.prisma.transactions.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { number: true },
      });

      const lastNumber = lastTransaction?.number
        ? parseInt(lastTransaction.number.match(/\d+$/)?.[0] || '0', 10)
        : 0;
      const nextNumber = lastNumber + 1;

      const sequenceNumber = nextNumber.toString().padStart(8, '0');

      return `${prefix}-${sequenceNumber}`;
    } catch (error) {
      this.logger.error('Failed to generate transaction number', error);
      throw error;
    }
  }

  async generateVerificationCode(): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }

  async generateTempPassword(length = 12) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }
}
