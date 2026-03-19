import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CustomerViolationDto } from './customer-violation.dto.js';
import { Tenant, User } from '../../../../generated/prisma/client.js';
import { CustomerService } from '../../customer.service.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class CustomerViolationService {
  private readonly logger = new Logger(CustomerViolationService.name);

  constructor(
    private readonly customerService: CustomerService,
    private readonly prisma: PrismaService,
  ) {}

  async getAllCustomerViolations(tenant: Tenant) {
    try {
      const violations = await this.prisma.customerViolation.findMany({
        where: { tenantId: tenant.id },
      });
      return violations;
    } catch (error) {
      this.logger.error(error, 'Error fetching all customer violations', {
        tenantId: tenant.id,
      });
      throw error;
    }
  }

  async getCustomerViolations(tenant: Tenant, customerId: string) {
    try {
      const violations = await this.prisma.customerViolation.findMany({
        where: { tenantId: tenant.id, customerId },
      });
      return violations;
    } catch (error) {
      this.logger.error(error, 'Error fetching customer violations', {
        tenantId: tenant.id,
        customerId,
      });
      throw error;
    }
  }

  async createCustomerViolation(
    data: CustomerViolationDto,
    tenant: Tenant,
    user: User,
  ) {
    const customer = await this.customerService.getCustomerById(
      data.customerId,
    );

    if (!customer) {
      this.logger.warn('Customer not found for violation', {
        customerId: data.customerId,
        tenantId: tenant.id,
      });
      throw new NotFoundException('Customer not found');
    }

    const violation = await this.prisma.customerViolation.create({
      data: {
        id: data.id,
        customerId: data.customerId,
        violationId: data.violationId,
        violationDate: new Date(data.violationDate),
        notes: data.notes,
        tenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: user.username,
      },
    });

    return {
      message: 'Customer violation created successfully',
      violation,
    };
  }

  async updateCustomerViolation(
    data: CustomerViolationDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const existingRecord = await this.prisma.customerViolation.findUnique({
        where: { id: data.id, tenantId: tenant.id },
      });

      if (!existingRecord) {
        this.logger.warn('Customer violation not found for update', {
          violationId: data.id,
          tenantId: tenant.id,
        });
        throw new NotFoundException('Customer violation not found');
      }

      const violation = await this.prisma.customerViolation.update({
        where: { id: data.id },
        data: {
          customerId: data.customerId,
          violationId: data.violationId,
          violationDate: new Date(data.violationDate),
          notes: data.notes,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const customerViolations = await this.prisma.customerViolation.findMany({
        where: { tenantId: tenant.id, customerId: data.customerId },
      });

      return {
        message: 'Customer violation updated successfully',
        violation,
        violations: customerViolations,
      };
    } catch (error) {
      this.logger.error(error, 'Error updating customer violation', {
        violationData: data,
      });
      throw error;
    }
  }

  async deleteCustomerViolation(id: string, tenant: Tenant, user: User) {
    try {
      const existingRecord = await this.prisma.customerViolation.findUnique({
        where: { id, tenantId: tenant.id },
      });

      if (!existingRecord) {
        this.logger.warn('Customer violation not found for deletion', {
          violationId: id,
          tenantId: tenant.id,
        });
        throw new NotFoundException('Customer violation not found');
      }

      await this.prisma.customerViolation.delete({
        where: { id },
      });

      const customerViolations = await this.prisma.customerViolation.findMany({
        where: { tenantId: tenant.id, customerId: existingRecord.customerId },
      });

      return {
        message: 'Customer violation deleted successfully',
        violations: customerViolations,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting customer violation', {
        violationId: id,
        tenantId: tenant.id,
        userId: user.id,
      });
      throw error;
    }
  }
}
