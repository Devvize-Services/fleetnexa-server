import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, TxClient } from '../../../prisma/prisma.service.js';
import { StorefrontCustomerDto } from './storefront-customer.dto.js';
import { Tenant } from '../../../generated/prisma/client.js';

@Injectable()
export class StorefrontCustomerService {
  private readonly logger = new Logger(StorefrontCustomerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCustomer(data: StorefrontCustomerDto, tenant: Tenant, tx: TxClient) {
    try {
      const existingCustomer = await tx.customer.findFirst({
        where: {
          tenantId: tenant.id,
          license: {
            licenseNumber: data.driverLicenseNumber,
          },
        },
      });

      if (existingCustomer) {
        await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            storefrontId: data.storefrontId || existingCustomer.storefrontId,
          },
        });

        await tx.driverLicense.update({
          where: { customerId: existingCustomer.id },
          data: {
            licenseExpiry: data.licenseExpiry,
            licenseIssued: data.licenseIssued,
          },
        });

        if (data.address) {
          await tx.customerAddress.upsert({
            where: { customerId: existingCustomer.id },
            update: {
              street: data.address.street,
              village: data.address.villageId
                ? { connect: { id: data.address.villageId } }
                : undefined,
              state: data.address.stateId
                ? { connect: { id: data.address.stateId } }
                : undefined,
              country: data.address.countryId
                ? { connect: { id: data.address.countryId } }
                : undefined,
            },
            create: {
              customer: { connect: { id: existingCustomer.id } },
              street: data.address.street,
              village: data.address.villageId
                ? { connect: { id: data.address.villageId } }
                : undefined,
              state: data.address.stateId
                ? { connect: { id: data.address.stateId } }
                : undefined,
              country: data.address.countryId
                ? { connect: { id: data.address.countryId } }
                : undefined,
            },
          });
        }

        return existingCustomer;
      } else {
        const customer = await tx.customer.create({
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

        const existingLicense = await tx.driverLicense.findUnique({
          where: { licenseNumber: data.driverLicenseNumber },
        });

        if (!existingLicense) {
          await tx.driverLicense.create({
            data: {
              customerId: customer.id,
              licenseNumber: data.driverLicenseNumber,
              licenseExpiry: data.licenseExpiry,
              image: data.license,
              licenseIssued: data.licenseIssued,
            },
          });
        } else {
          await tx.driverLicense.update({
            where: { licenseNumber: data.driverLicenseNumber },
            data: {
              customerId: customer.id,
              licenseExpiry: data.licenseExpiry,
              licenseIssued: data.licenseIssued,
              image: data.license,
            },
          });
        }

        if (data.address) {
          await tx.customerAddress.create({
            data: {
              customer: { connect: { id: customer.id } },
              street: data.address.street,
              village: data.address.villageId
                ? { connect: { id: data.address.villageId } }
                : undefined,
              state: data.address.stateId
                ? { connect: { id: data.address.stateId } }
                : undefined,
              country: data.address.countryId
                ? { connect: { id: data.address.countryId } }
                : undefined,
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
}
