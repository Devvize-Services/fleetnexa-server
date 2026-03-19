import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CustomerRepository } from './customer.repository.js';
import { Tenant, User } from '../../generated/prisma/browser.js';
import { TenantCustomerDto } from './dto/tenant-customer.dto.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { StorefrontCustomerDto } from './storefront-customer/storefront-customer.dto.js';
import { CustomerViolationDto } from './dto/customer-violation.dto.js';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerRepo: CustomerRepository,
  ) {}

  async getCustomers(tenant: Tenant) {
    try {
      return this.customerRepo.getTenantCustomers(tenant.id);
    } catch (error) {
      this.logger.error(error, 'Error fetching customers', {
        tenantId: tenant.id,
      });
      throw error;
    }
  }

  async getCustomerById(id: string) {
    try {
      return this.customerRepo.getCustomerById(id);
    } catch (error) {
      this.logger.error(error, 'Error fetching customer by ID', {
        customerId: id,
      });
      throw error;
    }
  }

  async createCustomer(data: CreateCustomerDto, tenant: Tenant, user: User) {
    try {
      const created = await this.customerRepo.createCustomer(
        data,
        tenant,
        user,
      );

      const customer = await this.getCustomerById(created.id);
      const customers = await this.getCustomers(tenant);

      return {
        message: 'Customer created successfully',
        customer,
        customers,
      };
    } catch (error) {
      this.logger.error(error, 'Error creating customer', {
        tenantId: tenant.id,
        userId: user.id,
        customerData: data,
      });
      throw error;
    }
  }

  async updateCustomer(data: TenantCustomerDto, tenant: Tenant, user: User) {
    try {
      await this.customerRepo.updateCustomer(data, tenant, user);

      const customer = await this.getCustomerById(data.id);
      const customers = await this.getCustomers(tenant);

      return {
        message: 'Customer updated successfully',
        customer,
        customers,
      };
    } catch (error) {
      this.logger.error(error, 'Error updating customer', {
        tenantId: tenant.id,
        userId: user.id,
        customerData: data,
      });
      throw error;
    }
  }

  async deleteCustomer(id: string, tenant: Tenant, user: User) {
    try {
      const existingRecord = await this.prisma.customer.findUnique({
        where: { id, tenantId: tenant.id },
      });

      if (!existingRecord) {
        this.logger.warn('Customer not found for deletion', {
          customerId: id,
          tenantId: tenant.id,
        });
        throw new NotFoundException('Customer not found');
      }

      await this.prisma.customer.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const customers = await this.getCustomers(tenant);

      return {
        message: 'Customer deleted successfully',
        customers,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting customer', {
        tenantId: tenant.id,
        userId: user.id,
        customerId: id,
      });
      throw error;
    }
  }

  async getPrimaryDriver(bookingId: string) {
    try {
      const driver =
        await this.customerRepo.getPrimaryDriverByBookingId(bookingId);

      if (!driver) {
        this.logger.warn(
          `Primary driver not found for booking ID: ${bookingId}`,
        );
        throw new NotFoundException('Primary driver not found');
      }

      return driver;
    } catch (error) {
      this.logger.error(
        error,
        `Error fetching primary driver for booking ID: ${bookingId}`,
        { bookingId },
      );
      throw error;
    }
  }
}
