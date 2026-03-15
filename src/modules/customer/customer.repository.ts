import { Injectable } from '@nestjs/common';
import { Prisma, Tenant, User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantCustomers(
    tenantId: string,
    additionalWhere?: Prisma.CustomerWhereInput,
  ) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        isDeleted: false,
        ...additionalWhere,
      },
      include: this.getCustomerIncludeOptions(),
    });
  }

  async getCustomerByLicenseNumber(tenantId: string, licenseNumber: string) {
    return this.prisma.customer.findFirst({
      where: {
        tenantId,
        isDeleted: false,
        license: {
          licenseNumber,
        },
      },
      include: this.getCustomerIncludeOptions(),
    });
  }

  async getCustomerById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id, isDeleted: false },
      include: this.getCustomerIncludeOptions(),
    });
  }

  async getPrimaryDriverByBookingId(bookingId: string) {
    return this.prisma.rentalDriver.findFirst({
      where: {
        rentalId: bookingId,
        isPrimary: true,
      },
      include: {
        customer: {
          include: {
            license: true,
            address: {
              include: {
                country: true,
                state: true,
                village: true,
              },
            },
          },
        },
      },
    });
  }

  async createCustomer(data: CreateCustomerDto, tenant: Tenant, user: User) {
    return this.prisma.$transaction(async (tx) => {
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
          updatedBy: user.username,
          profileImage: data.profileImage,
          tenantId: tenant.id,
          status: data.status,
        },
      });

      await tx.driverLicense.create({
        data: {
          customerId: customer.id,
          licenseNumber: data.license.licenseNumber,
          licenseExpiry: data.license.licenseExpiry,
          licenseIssued: data.license.licenseIssued,
          image: data.license.image,
        },
      });

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
    });
  }

  async updateCustomer(
    data: CreateCustomerDto & { id: string },
    tenant: Tenant,
    user: User,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existingRecord = await tx.customer.findUnique({
        where: { id: data.id, tenantId: tenant.id },
      });

      if (!existingRecord) {
        throw new Error('Customer not found');
      }

      await tx.customer.update({
        where: { id: data.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          email: data.email,
          phone: data.phone,
          updatedBy: user.username,
          updatedAt: new Date(),
          profileImage: data.profileImage,
          status: data.status,
        },
      });

      await tx.driverLicense.update({
        where: { customerId: data.id },
        data: {
          licenseNumber: data.license.licenseNumber,
          licenseIssued: data.license.licenseIssued,
          licenseExpiry: data.license.licenseExpiry,
          image: data.license.image,
        },
      });

      if (data.address) {
        const addressData = {
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
        };

        await tx.customerAddress.upsert({
          where: { customerId: data.id },
          update: addressData,
          create: {
            customer: { connect: { id: data.id } },
            ...addressData,
          },
        });
      }
    });
  }

  private getCustomerIncludeOptions(): Prisma.CustomerInclude {
    return {
      address: {
        include: {
          country: true,
          state: true,
          village: true,
        },
      },
      documents: {
        include: {
          document: true,
        },
      },
      drivers: {
        include: {
          rental: {
            include: {
              pickup: true,
              return: true,
              vehicle: {
                include: {
                  brand: true,
                  model: {
                    include: {
                      bodyType: true,
                    },
                  },
                  vehicleStatus: true,
                  transmission: true,
                  wheelDrive: true,
                  fuelType: true,
                  features: true,
                  damages: {
                    where: { isDeleted: false },
                    include: {
                      customer: true,
                    },
                  },
                },
              },
              payments: {
                where: { isDeleted: false },
                include: {
                  paymentMethod: true,
                  paymentType: true,
                  receipt: true,
                },
              },
              values: {
                include: {
                  extras: true,
                },
              },
            },
          },
        },
      },
      invoices: true,
      damages: true,
      license: {
        include: {
          class: true,
          country: true,
        },
      },
      apps: true,
      violations: {
        include: {
          violation: true,
        },
      },
    };
  }
}
