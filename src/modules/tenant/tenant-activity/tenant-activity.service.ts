import { Injectable, Logger } from '@nestjs/common';
import { Tenant } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class TenantActivityService {
  private readonly logger = new Logger(TenantActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantActivities(tenant: Tenant) {
    try {
      return await this.prisma.rentalActivity.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          vehicle: {
            select: {
              brand: true,
              model: true,
            },
          },
          customer: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to get tenant activities', error);
      throw error;
    }
  }
}
