import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VehicleLocationDto } from '../dto/vehicle-location.dto.js';
import { Tenant, User } from '../../../generated/prisma/client.js';
import { VehicleRepository } from '../vehicle.repository.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class VehicleLocationService {
  private readonly logger = new Logger(VehicleLocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleRepo: VehicleRepository,
  ) {}

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
}
