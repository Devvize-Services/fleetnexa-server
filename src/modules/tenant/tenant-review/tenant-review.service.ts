import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Tenant } from '../../../generated/prisma/client.js';
import { RateTenantDto } from '../dto/rate-tenant.dto.js';

@Injectable()
export class TenantReviewService {
  private readonly logger = new Logger(TenantReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantReviews(tenant: Tenant) {
    try {
      const reviews = await this.prisma.tenantRatings.findMany({
        where: { tenantId: tenant.id },
      });
      return reviews;
    } catch (error) {
      this.logger.error(error, 'Error fetching tenant reviews', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async addTenantReview(data: RateTenantDto) {
    try {
      await this.prisma.tenantRatings.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          rating: data.rating,
          tenantId: data.tenantId,
          comment: data.comment,
        },
      });

      return { message: 'Tenant review added successfully' };
    } catch (error) {
      this.logger.error(error, 'Error adding tenant review', {
        tenantId: data.tenantId,
        email: data.email,
      });
      throw error;
    }
  }
}
