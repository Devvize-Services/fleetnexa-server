import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VehicleRepository } from './vehicle.repository.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantExtraService } from '../tenant/tenant-extra/tenant-extra.service.js';
import {
  Tenant,
  User,
  Vehicle,
  VehicleEventType,
} from '../../generated/prisma/client.js';
import { VehicleDto } from './dto/vehicle.dto.js';
import { StorageService } from '../storage/storage.service.js';
import { VehicleStatusDto } from './dto/vehicle-status.dto.js';
import { VehicleLocationDto } from './dto/vehicle-location.dto.js';
import { SwapVehicleDto } from './dto/swap-vehicle.dto.js';
import { VehicleEventService } from './modules/vehicle-event/vehicle-event.service.js';
import { VehicleEventDto } from './dto/vehicle-event.dto.js';
import { BookingRepository } from '../booking/booking.repository.js';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    private readonly vehicleRepo: VehicleRepository,
    private readonly prisma: PrismaService,
    private readonly extrasService: TenantExtraService,
    private readonly storage: StorageService,
    private readonly bookingRepo: BookingRepository,
    private readonly vehicleEvent: VehicleEventService,
  ) {}

  async getTenantVehicles(tenant: Tenant) {
    try {
      return await this.vehicleRepo.getVehicles(tenant.id);
    } catch (error) {
      this.logger.error(error, 'Failed to get vehicles', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getVehicleById(id: string, tenant: Tenant) {
    try {
      const vehicle = await this.vehicleRepo.getVehicleById(id, tenant.id);
      return await this.attachTenantExtras(vehicle);
    } catch (error) {
      this.logger.error(error, `Failed to get vehicle by id: ${id}`, {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getVehicleByLicensePlate(licensePlate: string, tenant: Tenant) {
    try {
      const vehicle = await this.vehicleRepo.getVehicleByLicensePlate(
        licensePlate,
        tenant.id,
      );
      return await this.attachTenantExtras(vehicle);
    } catch (error) {
      this.logger.error(
        error,
        `Failed to get vehicle by license plate: ${licensePlate}`,
        {
          tenantId: tenant.id,
          tenantCode: tenant.tenantCode,
        },
      );
      throw error;
    }
  }

  async getStorefrontVehicles() {
    try {
      const vehicles = await this.vehicleRepo.getVehiclesForStorefront();
      return await this.attachExtrasToVehicles(vehicles);
    } catch (error) {
      this.logger.error('Failed to get storefront vehicles', error);
      throw error;
    }
  }

  async getTenantStorefrontVehicles(tenantId: string) {
    try {
      const vehicles =
        await this.vehicleRepo.getTenantVehiclesForStorefront(tenantId);
      return await this.attachExtrasToVehicles(vehicles);
    } catch (error) {
      this.logger.error(
        `Failed to get storefront vehicles for tenant: ${tenantId}`,
        error,
      );
      throw error;
    }
  }

  async getVehicleForStorefrontById(id: string) {
    try {
      const vehicle = await this.vehicleRepo.getVehicleForStorefrontById(id);
      return await this.attachTenantExtras(vehicle);
    } catch (error) {
      this.logger.error(`Failed to get storefront vehicle by id: ${id}`, error);
      throw error;
    }
  }

  async addVehicle(data: VehicleDto, tenant: Tenant, user: User) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const existingPlate = await tx.vehicle.findFirst({
            where: {
              licensePlate: data.licensePlate,
            },
          });

          if (existingPlate) {
            this.logger.warn(
              `Conflict: Vehicle with license plate ${data.licensePlate} already exists`,
            );
            throw new ConflictException(
              'A vehicle with this license plate already exists',
            );
          }

          await tx.vehicle.create({
            data: {
              id: data.id,
              tenantId: tenant.id,
              color: data.color,
              engineVolume: data.engineVolume,
              featuredImage: data.featuredImage,
              features:
                data.features && data.features.length > 0
                  ? {
                      connect: data.features.map((feature) => ({
                        id: feature.id,
                      })),
                    }
                  : undefined,
              fuelLevel: data.fuelLevel,
              images: data.images || [],
              licensePlate: data.licensePlate,
              brandId: data.brandId,
              modelId: data.modelId,
              numberOfSeats: data.numberOfSeats,
              numberOfDoors: data.numberOfDoors,
              odometer: data.odometer || 0,
              steering: data.steering,
              vin: data.vin || '',
              year: data.year,
              transmissionId: data.transmissionId,
              vehicleStatusId: data.vehicleStatusId,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: user.username,
              wheelDriveId: data.wheelDriveId,
              fuelTypeId: data.fuelTypeId,
              isDeleted: false,
              dayPrice: data.dayPrice,
              weekPrice: data.weekPrice,
              monthPrice: data.monthPrice,
              timeBetweenRentals: data.timeBetweenRentals,
              minimumAge: data.minimumAge,
              minimumRental: data.minimumRental,
              fuelPolicyId: data.fuelPolicyId,
              locationId: data.locationId,
              drivingExperience: data.drivingExperience,
              createdBy: user.username,
            },
          });

          if (data.discounts && data.discounts.length > 0) {
            await Promise.all(
              data.discounts.map((discount) =>
                tx.vehicleDiscount.upsert({
                  where: { id: discount.id },
                  create: {
                    id: discount.id,
                    vehicleId: data.id,
                    period: Number(discount.period),
                    periodPolicy: discount.periodPolicy,
                    amount: discount.amount,
                    discountPolicy: discount.discountPolicy,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: user.username,
                  },
                  update: {
                    amount: discount.amount,
                    period: Number(discount.period),
                    periodPolicy: discount.periodPolicy,
                    discountPolicy: discount.discountPolicy,
                    updatedAt: new Date(),
                    updatedBy: user.username,
                  },
                }),
              ),
            );
          }
        },
        { maxWait: 5000, timeout: 10000 },
      );

      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);
      return {
        message: 'Vehicle added successfully',
        vehicles,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to add vehicle', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateVehicle(data: VehicleDto, tenant: Tenant, user: User) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.id },
      });

      if (!vehicle) {
        this.logger.warn(`Vehicle with id ${data.id} not found for update`);
        throw new NotFoundException('Vehicle not found');
      }

      const imagesToDelete = vehicle.images.filter(
        (img) => !data.images.includes(img),
      );

      const updatedVehicle = await this.prisma.$transaction(
        async (tx) => {
          await tx.vehicle.update({
            where: { id: data.id },
            data: {
              color: data.color,
              engineVolume: data.engineVolume,
              featuredImage: data.featuredImage,
              features:
                data.features && data.features.length > 0
                  ? {
                      set: data.features.map((feature) => ({
                        id: feature.id,
                      })),
                    }
                  : { set: [] },
              fuelLevel: data.fuelLevel,
              images: data.images || [],
              licensePlate: data.licensePlate,
              brandId: data.brandId,
              modelId: data.modelId,
              numberOfSeats: data.numberOfSeats,
              numberOfDoors: data.numberOfDoors,
              odometer: data.odometer || 0,
              steering: data.steering,
              vin: data.vin || '',
              year: data.year,
              transmissionId: data.transmissionId,
              vehicleStatusId: data.vehicleStatusId,
              updatedAt: new Date(),
              updatedBy: user.username,
              wheelDriveId: data.wheelDriveId,
              fuelTypeId: data.fuelTypeId,
              dayPrice: data.dayPrice,
              weekPrice: data.weekPrice,
              monthPrice: data.monthPrice,
              timeBetweenRentals: data.timeBetweenRentals,
              minimumAge: data.minimumAge,
              minimumRental: data.minimumRental,
              fuelPolicyId: data.fuelPolicyId,
              locationId: data.locationId,
              drivingExperience: data.drivingExperience,
            },
          });

          if (data.discounts && data.discounts.length > 0) {
            const newDiscountIds = data.discounts
              .map((discount: any) => discount.id)
              .filter(Boolean);

            await tx.vehicleDiscount.deleteMany({
              where: {
                vehicleId: vehicle.id,
                NOT: { id: { in: newDiscountIds } },
              },
            });

            await Promise.all(
              data.discounts.map((discount) =>
                tx.vehicleDiscount.upsert({
                  where: { id: discount.id },
                  create: {
                    id: discount.id,
                    vehicleId: data.id,
                    amount: discount.amount,
                    discountPolicy: discount.discountPolicy,
                    period: Number(discount.period),
                    periodPolicy: discount.periodPolicy,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: user.username,
                  },
                  update: {
                    amount: discount.amount,
                    discountPolicy: discount.discountPolicy,
                    period: Number(discount.period),
                    periodPolicy: discount.periodPolicy,
                    updatedAt: new Date(),
                    updatedBy: user.username,
                  },
                }),
              ),
            );
          }

          return tx.vehicle.findUnique({ where: { id: data.id } });
        },
        { maxWait: 5000, timeout: 10000 },
      );

      for (const img of imagesToDelete) {
        try {
          await this.storage.deleteFile(img);
          this.logger.log(`Deleted unused image ${img} for vehicle ${data.id}`);
        } catch (err) {
          this.logger.error(
            `Failed to delete unused image ${img} for vehicle ${data.id}`,
            err,
          );
        }
      }

      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);
      return {
        message: 'Vehicle updated successfully',
        vehicles,
        vehicle: updatedVehicle,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update vehicle', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateVehicleStatus(
    data: VehicleStatusDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(
          `Vehicle with id ${data.vehicleId} not found for status update`,
        );
        throw new NotFoundException('Vehicle not found');
      }

      await this.prisma.$transaction(async (tx) => {
        const foundStatus = await tx.vehicleStatus.findFirst({
          where: {
            status: {
              equals: data.status,
              mode: 'insensitive',
            },
          },
        });

        if (!foundStatus) {
          this.logger.warn(`Vehicle status ${data.status} not found`);
          throw new NotFoundException('Vehicle status not found');
        }

        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: {
            vehicleStatusId: foundStatus.id,
            updatedBy: user.username,
          },
        });
      });

      const updatedVehicle = await this.vehicleRepo.getVehicleById(
        data.vehicleId,
        tenant.id,
      );
      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle status updated successfully',
        vehicles,
        vehicle: updatedVehicle,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update vehicle status', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateVehicleLocation(
    data: VehicleLocationDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(
          `Vehicle with id ${data.vehicleId} not found for location update`,
        );
        throw new NotFoundException('Vehicle not found');
      }

      const existingLocation = await this.prisma.tenantLocation.findFirst({
        where: {
          id: data.locationId,
          tenantId: tenant.id,
        },
      });

      if (!existingLocation) {
        this.logger.warn(
          `Location with id ${data.locationId} not found for tenant ${tenant.id}`,
        );
        throw new NotFoundException('Location not found');
      }

      await this.prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: {
          locationId: data.locationId,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const updatedVehicle = await this.vehicleRepo.getVehicleById(
        data.vehicleId,
        tenant.id,
      );
      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle location updated successfully',
        vehicles,
        vehicle: updatedVehicle,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update vehicle location', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async deleteVehicle(id: string, tenant: Tenant, user: User) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(`Vehicle with id ${id} not found for status update`);
        throw new NotFoundException('Vehicle not found');
      }

      await this.prisma.vehicle.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle deleted successfully',
        vehicles,
      };
    } catch (error) {}
  }

  async updateVehicleStorefrontStatus(id: string, tenant: Tenant, user: User) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(`Vehicle with id ${id} not found for status update`);
        throw new NotFoundException('Vehicle not found');
      }

      const updatedVehicle = await this.prisma.$transaction(async (tx) => {
        if (!tenant.storefrontEnabled) {
          this.logger.warn(
            'Tenant storefront is disabled, tried to list vehicle',
            {
              tenantId: tenant.id,
              tenantCode: tenant.tenantCode,
            },
          );
          throw new BadRequestException(
            'Your storefront is disabled, enable it to list vehicles',
          );
        }

        await tx.vehicle.update({
          where: { id },
          data: {
            storefrontEnabled: !vehicle.storefrontEnabled,
            updatedBy: user.username,
          },
        });

        return tx.vehicle.findUnique({ where: { id } });
      });
      let message = '';

      if (!updatedVehicle?.storefrontEnabled) {
        this.logger.log(
          `Vehicle delisted from storefront by tenant ${user.username}`,
        );
        message = 'Vehicle delisted from storefront successfully';
      } else {
        message = 'Vehicle listed on storefront successfully';
      }

      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message,
        vehicle: updatedVehicle,
        vehicles,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update vehicle storefront status', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        vehicleId: id,
      });
      throw error;
    }
  }

  private async attachTenantExtras(vehicle: any) {
    if (!vehicle?.tenantId) return vehicle;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: vehicle.tenantId },
    });

    if (!tenant) return vehicle;

    const extras = await this.extrasService.getTenantExtras(tenant);

    return {
      ...vehicle,
      tenant: {
        ...vehicle.tenant,
        extras,
      },
    };
  }

  private async attachExtrasToVehicles(vehicles: any[]) {
    return Promise.all(
      vehicles.map((vehicle) => this.attachTenantExtras(vehicle)),
    );
  }

  async swapBookingVehicle(data: SwapVehicleDto, tenant: Tenant, user: User) {
    try {
      const existingBooking = await this.prisma.rental.findUnique({
        where: { id: data.bookingId },
        include: { vehicle: true },
      });

      if (!existingBooking) {
        this.logger.warn(
          `Booking with id ${data.bookingId} not found for swap`,
        );
        throw new NotFoundException('Booking not found');
      }

      if (existingBooking.vehicleId !== data.oldVehicleId) {
        this.logger.warn(
          `Old vehicle id ${data.oldVehicleId} does not match booking's current vehicle id ${existingBooking.vehicleId}`,
        );
        throw new BadRequestException(
          "Old vehicle does not match the booking's current vehicle",
        );
      }

      const newVehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.newVehicleId, tenantId: tenant.id },
      });

      if (!newVehicle) {
        this.logger.warn(
          `New vehicle with id ${data.newVehicleId} not found for swap`,
        );
        throw new NotFoundException('New vehicle not found');
      }

      await this.prisma.rental.update({
        where: { id: data.bookingId },
        data: {
          vehicleId: data.newVehicleId,
          updatedAt: new Date(),
        },
      });

      await this.updateVehicleStatus(
        {
          vehicleId: data.oldVehicleId,
          status: 'AVAILABLE',
        },
        tenant,
        user,
      );

      await this.updateVehicleStatus(
        {
          vehicleId: data.newVehicleId,
          status: 'RENTED',
        },
        tenant,
        user,
      );

      await this.prisma.bookingVehicleHistory.create({
        data: {
          bookingId: data.bookingId,
          fromVehicleId: data.oldVehicleId,
          toVehicleId: data.newVehicleId,
          reason: data.reason || '',
          swappedAt: new Date(),
          swappedBy: user.username,
        },
      });

      const vehicleOutEvent: VehicleEventDto = {
        vehicleId: data.oldVehicleId,
        event: `Vehicle swapped out from booking #${existingBooking!.rentalNumber}`,
        type: VehicleEventType.SWAPPED_OUT,
        date: new Date().toISOString(),
        notes: `Vehicle Swapped Out for #${existingBooking!.rentalNumber}  by ${user.username}`,
      };

      const vehicleInEvent: VehicleEventDto = {
        vehicleId: data.newVehicleId,
        event: `Vehicle swapped in for booking #${existingBooking!.rentalNumber}`,
        type: VehicleEventType.SWAPPED_IN,
        date: new Date().toISOString(),
        notes: `Vehicle Swapped In for #${existingBooking!.rentalNumber} by ${user.username}`,
      };

      await this.vehicleEvent.createEvent(vehicleOutEvent);
      await this.vehicleEvent.createEvent(vehicleInEvent);

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: 'Vehicle swapped successfully',
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to swap booking vehicle', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }
}
