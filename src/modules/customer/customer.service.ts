import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CustomerRepository } from './customer.repository.js';
import { Tenant, User } from '../../generated/prisma/browser.js';
import { TenantCustomerDto } from './dto/tenant-customer.dto.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { StorefrontCustomerDto } from './storefront-customer/storefront-customer.dto.js';

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

  async getStorefrontCustomer(data: StorefrontCustomerDto, tenant: Tenant) {
    try {
      const addressData = data.address
        ? await this.buildStorefrontAddressData(data.address, tenant)
        : null;

      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          tenantId: tenant.id,
          license: {
            licenseNumber: data.driverLicenseNumber,
          },
        },
      });

      if (existingCustomer) {
        await this.prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            storefrontId: data.storefrontId || existingCustomer.storefrontId,
          },
        });

        await this.prisma.driverLicense.update({
          where: { customerId: existingCustomer.id },
          data: {
            licenseExpiry: data.licenseExpiry,
            licenseIssued: data.licenseIssued,
          },
        });

        if (addressData) {
          await this.prisma.customerAddress.upsert({
            where: { customerId: existingCustomer.id },
            update: addressData!,
            create: {
              customer: { connect: { id: existingCustomer.id } },
              ...addressData!,
            },
          });
        }

        return existingCustomer;
      } else {
        const customer = await this.prisma.customer.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender || 'UNSPECIFIED',
            dateOfBirth: data.dateOfBirth,
            email: data.email,
            phone: data.phone || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            tenantId: tenant.id,
            status: 'ACTIVE',
            storefrontId: data.storefrontId || null,
          },
        });

        const existingLicense = await this.prisma.driverLicense.findUnique({
          where: { licenseNumber: data.driverLicenseNumber },
        });

        if (!existingLicense) {
          await this.prisma.driverLicense.create({
            data: {
              customerId: customer.id,
              licenseNumber: data.driverLicenseNumber,
              licenseExpiry: data.licenseExpiry,
              image: data.license,
              licenseIssued: data.licenseIssued,
            },
          });
        } else {
          await this.prisma.driverLicense.update({
            where: { licenseNumber: data.driverLicenseNumber },
            data: {
              customerId: customer.id,
              licenseExpiry: data.licenseExpiry,
              licenseIssued: data.licenseIssued,
              image: data.license,
            },
          });
        }

        if (addressData) {
          await this.prisma.customerAddress.create({
            data: {
              customer: { connect: { id: customer.id } },
              ...addressData!,
            },
          });
        }

        return customer;
      }
    } catch (error) {
      this.logger.error(error, 'Failed to get storefront customer', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  private async buildStorefrontAddressData(
    address: NonNullable<StorefrontCustomerDto['address']>,
    tenant: Tenant,
  ) {
    const [village, state, country] = await Promise.all([
      address.villageId
        ? this.prisma.village.findUnique({
            where: { id: address.villageId },
            select: { id: true },
          })
        : null,
      address.stateId
        ? this.prisma.state.findUnique({
            where: { id: address.stateId },
            select: { id: true },
          })
        : null,
      address.countryId
        ? this.prisma.country.findUnique({
            where: { id: address.countryId },
            select: { id: true },
          })
        : null,
    ]);

    this.logMissingAddressReference(
      'village',
      address.villageId,
      village?.id,
      tenant,
    );
    this.logMissingAddressReference(
      'state',
      address.stateId,
      state?.id,
      tenant,
    );
    this.logMissingAddressReference(
      'country',
      address.countryId,
      country?.id,
      tenant,
    );

    return {
      street: address.street,
      village: village ? { connect: { id: village.id } } : undefined,
      state: state ? { connect: { id: state.id } } : undefined,
      country: country ? { connect: { id: country.id } } : undefined,
    };
  }

  private logMissingAddressReference(
    relation: 'village' | 'state' | 'country',
    requestedId: string | undefined,
    resolvedId: string | undefined,
    tenant: Tenant,
  ) {
    if (!requestedId || resolvedId) {
      return;
    }

    this.logger.warn(
      `Ignoring missing ${relation} reference for storefront customer address`,
      {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        relation,
        requestedId,
      },
    );
  }
}
