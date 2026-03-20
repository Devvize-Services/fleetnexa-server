import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Tenant } from 'src/generated/prisma/client.js';
import { TenantRateDto } from './tenant-rate.dto.js';

@Injectable()
export class TenantRatesService {
  private readonly logger = new Logger(TenantRatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantRates(tenant: Tenant) {
    try {
      return await this.prisma.tenantCurrencyRate.findMany({
        where: { tenantId: tenant.id },
        include: {
          currency: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to get tenant rates', error);
      throw error;
    }
  }

  async updateTenantRate(data: TenantRateDto, tenant: Tenant) {
    try {
      const currencyRates = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.tenantCurrencyRate.findFirst({
          where: {
            id: data.id,
            tenantId: tenant.id,
          },
        });

        if (!existing) {
          this.logger.warn(
            `Tenant rate with ID ${data.id} not found for tenant ${tenant.id}`,
          );
          throw new NotFoundException('Tenant rate not found');
        }

        await tx.tenantCurrencyRate.update({
          where: { id: data.id },
          data: {
            fromRate: data.fromRate,
            toRate: data.toRate,
            enabled: data.enabled,
            currencyId: data.currencyId,
          },
        });

        const currencies = await tx.currency.findMany({
          where: { id: { not: data.currencyId } },
        });

        for (const currency of currencies) {
          const rateExists = await tx.tenantCurrencyRate.findFirst({
            where: { tenantId: tenant.id, currencyId: currency.id },
          });

          if (!rateExists) {
            await tx.tenantCurrencyRate.create({
              data: {
                fromRate: 0,
                toRate: 0,
                enabled: false,
                currencyId: currency.id,
                tenantId: tenant.id,
              },
              include: { currency: true },
            });
          }
        }

        return await tx.tenantCurrencyRate.findMany({
          where: { tenantId: tenant.id },
          include: { currency: true },
        });
      });

      return {
        message: 'Currency rates updated successfully',
        currencyRates,
      };
    } catch (error) {
      this.logger.error('Failed to update tenant rate', error);
      throw error;
    }
  }
}
