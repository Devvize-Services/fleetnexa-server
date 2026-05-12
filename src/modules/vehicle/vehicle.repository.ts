import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getVehicles(
    tenantId: string,
    additionalWhere?: Prisma.VehicleWhereInput,
  ) {
    return this.prisma.vehicle.findMany({
      where: {
        tenantId,
        isDeleted: false,
        ...additionalWhere,
      },
      include: this.getVehicleIncludeOptions(),
    });
  }

  async getVehiclesForStorefront() {
    return this.prisma.vehicle.findMany({
      where: {
        storefrontEnabled: true,
        isDeleted: false,
        tenant: {
          tenantLocations: {
            some: { storefrontEnabled: true, isDeleted: false },
          },
        },
      },
      select: this.getVehicleSelectOptions(),
    });
  }

  async getAllVehicles() {
    return this.prisma.vehicle.findMany({
      where: {
        isDeleted: false,
      },
      include: this.getVehicleIncludeOptions(),
    });
  }

  async getVehicleById(id: string, tenantId: string) {
    return this.prisma.vehicle.findUnique({
      where: { id, tenantId, isDeleted: false },
      include: this.getVehicleIncludeOptions(),
    });
  }

  async getVehicleForStorefrontById(id: string) {
    return this.prisma.vehicle.findUnique({
      where: {
        id,
        storefrontEnabled: true,
        isDeleted: false,
        tenant: {
          tenantLocations: {
            some: { storefrontEnabled: true, isDeleted: false },
          },
        },
      },
      select: this.getVehicleSelectOptions(),
    });
  }

  async getTenantVehiclesForStorefront(tenantId: string) {
    return this.prisma.vehicle.findMany({
      where: { tenantId, isDeleted: false },
      select: this.getVehicleSelectOptions(),
    });
  }

  async getVehicleByLicensePlate(licensePlate: string, tenantId: string) {
    return this.prisma.vehicle.findUnique({
      where: { licensePlate, tenantId, isDeleted: false },
      include: this.getVehicleIncludeOptions(),
    });
  }

  private getVehicleIncludeOptions(): Prisma.VehicleInclude {
    return {
      brand: true,
      model: {
        include: {
          bodyType: true,
        },
      },
      vehicleStatus: true,
      events: true,
      swapFromHistory: true,
      swapToHistory: true,
      transmission: true,
      wheelDrive: true,
      location: true,
      discounts: true,
      rentals: {
        where: { isDeleted: false },
        include: {
          pickup: true,
          return: true,
          values: true,
          drivers: {
            include: {
              customer: {
                include: {
                  license: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          transactions: {
            include: {
              payment: {
                include: {
                  customer: true,
                  paymentMethod: true,
                  paymentType: true,
                },
              },
              refund: true,
              // user: {
              //   select: {
              //     firstName: true,
              //     lastName: true,
              //     username: true,
              //   },
              // },
            },
            orderBy: {
              transactionDate: 'desc',
            },
          },
          payments: {
            include: {
              paymentMethod: true,
              paymentType: true,
            },
          },
        },
      },
      fuelType: true,
      features: true,
      scheduledMaintenance: {
        where: { isDeleted: false },
        include: {
          services: true,
          vendor: true,
        },
      },
      damages: {
        where: { isDeleted: false },
        include: {
          customer: true,
        },
      },
      serviceLogs: {
        include: {
          maintenanceService: true,
          contact: true,
          scheduledService: true,
          damage: true,
        },
      },
      scheduledServices: {
        include: {
          maintenanceService: true,
        },
      },
      _count: {
        select: {
          rentals: {
            where: { isDeleted: false },
          },
          damages: {
            where: { isDeleted: false },
          },
          serviceLogs: true,
        },
      },
    };
  }

  getVehicleSelectOptions(): Prisma.VehicleSelect {
    return {
      id: true,
      year: true,
      color: true,
      licensePlate: true,
      engineVolume: true,
      steering: true,
      fuelLevel: true,
      featuredImage: true,
      vehicleStatus: true,
      wheelDrive: true,
      images: true,
      brand: true,
      minimumAge: true,
      numberOfSeats: true,
      numberOfDoors: true,
      transmission: true,
      features: true,
      fuelPolicy: true,
      fuelType: true,
      dayPrice: true,
      minimumRental: true,
      drivingExperience: true,
      discounts: true,
      tenantId: true,
      model: {
        include: {
          bodyType: true,
        },
      },
      rentals: {
        where: {
          status: {
            in: ['PENDING', 'ACTIVE', 'COMPLETED'],
          },
          endDate: {
            gte: new Date(),
          },
        },
        select: {
          startDate: true,
          endDate: true,
        },
      },
      tenant: {
        where: {
          tenantLocations: {
            some: { storefrontEnabled: true, isDeleted: false },
          },
        },
        select: {
          id: true,
          tenantName: true,
          slug: true,
          currency: true,
          logo: true,
          securityDeposit: true,
          rating: true,
          ratings: true,
          startTime: true,
          endTime: true,
          tenantLocations: {
            where: { storefrontEnabled: true, isDeleted: false },
          },
          currencyRates: {
            include: {
              currency: true,
            },
          },
          address: {
            include: {
              country: true,
              state: true,
              village: true,
            },
          },
        },
      },
    };
  }
}
