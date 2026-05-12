import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatusDto } from '../dto/vehicle-status.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { VehicleRepository } from '../vehicle.repository.js';
import { Tenant, User } from '../../../generated/prisma/client.js';

@Injectable()
export class VehicleStatusService {
  private readonly logger = new Logger(VehicleStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleRepo: VehicleRepository,
  ) {}

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
}
