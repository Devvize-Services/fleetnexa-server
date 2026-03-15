import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Tenant } from '../../../generated/prisma/client.js';
import { TenantViolationDto } from './tenant-violation.dto.js';

@Injectable()
export class TenantViolationService {
  private readonly logger = new Logger(TenantViolationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantViolations(tenant: Tenant) {
    try {
      const violations = await this.prisma.tenantViolation.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
      });

      return violations;
    } catch (error) {
      this.logger.error(error, 'Error fetching tenant violations', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
    }
  }

  async createViolation(data: TenantViolationDto, tenant: Tenant) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existingViolation = await tx.tenantViolation.findFirst({
          where: { tenantId: tenant.id, violation: data.violation },
        });

        if (existingViolation) {
          throw new Error('Violation with this name already exists');
        }

        await tx.tenantViolation.create({
          data: {
            tenantId: tenant.id,
            violation: data.violation,
            description: data.description,
            amount: data.amount,
            createdAt: new Date(),
          },
        });

        return await tx.tenantViolation.findMany({
          where: { tenantId: tenant.id, isDeleted: false },
        });
      });

      const violations = await this.getTenantViolations(tenant);

      return {
        message: 'Violation created successfully',
        violations,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to create violation', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        violation: data.violation,
      });
    }
  }

  async updateViolation(data: TenantViolationDto, tenant: Tenant) {
    try {
      const violations = await this.prisma.$transaction(async (tx) => {
        const existingViolation = await tx.tenantViolation.findUnique({
          where: {
            id: data.id,
          },
        });

        if (!existingViolation) {
          throw new Error('Violation not found');
        }

        await tx.tenantViolation.update({
          where: { id: data.id },
          data: {
            violation: data.violation,
            description: data.description,
            amount: data.amount,
            updatedAt: new Date(),
          },
        });

        return await tx.tenantViolation.findMany({
          where: { tenantId: tenant.id, isDeleted: false },
        });
      });

      return {
        message: 'Violation updated successfully',
        violations,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update violation', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        violation: data.violation,
      });
      throw new Error('Failed to update violation');
    }
  }

  async deleteViolation(violationId: string, tenant: Tenant) {
    try {
      const violations = await this.prisma.$transaction(async (tx) => {
        const existingViolation = await tx.tenantViolation.findUnique({
          where: { id: violationId },
        });

        if (!existingViolation) {
          throw new Error('Violation not found');
        }

        await tx.tenantViolation.update({
          where: { id: violationId },
          data: { isDeleted: true, updatedAt: new Date() },
        });

        return await tx.tenantViolation.findMany({
          where: {
            tenantId: tenant.id,
            isDeleted: false,
          },
        });
      });

      return {
        message: 'Violation deleted successfully',
        violations,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to delete violation', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        violationId,
      });
      throw new Error('Failed to delete violation');
    }
  }
}
