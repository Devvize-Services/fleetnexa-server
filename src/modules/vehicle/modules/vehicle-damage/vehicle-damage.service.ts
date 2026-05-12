import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Tenant, User } from '../../../../generated/prisma/client.js';
import { VehicleDamageDto } from './vehicle-damage.dto.js';

@Injectable()
export class VehicleDamageService {
  private readonly logger = new Logger(VehicleDamageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getVehicleDamages(vehicleId: string, tenant: Tenant) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(
          `Vehicle with ID ${vehicleId} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Vehicle not found');
      }

      const damages = await this.prisma.vehicleDamage.findMany({
        where: { vehicleId: vehicle.id, isDeleted: false },
        include: {
          customer: true,
        },
      });

      return damages;
    } catch (error) {
      this.logger.error(error, 'Failed to get vehicle damages', {
        vehicleId,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async addVehicleDamage(data: VehicleDamageDto, tenant: Tenant, user: User) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(
          `Vehicle with ID ${data.vehicleId} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Vehicle not found');
      }

      if (data.customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: data.customerId, tenantId: tenant.id },
        });

        if (!customer) {
          throw new NotFoundException('Customer not found');
        }
      }

      await this.prisma.vehicleDamage.create({
        data: {
          id: data.id,
          vehicleId: vehicle.id,
          description: data.description,
          images: data.images,
          isRepaired: data.isRepaired,
          partId: data.partId,
          customerId: data.customerId || null,
          location: data.location,
          title: data.title,
          severity: data.severity,
          createdAt: new Date(),
        },
      });

      const damages = await this.getVehicleDamages(vehicle.id, tenant);

      return {
        message: 'Vehicle damage added successfully',
        damages,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to add vehicle damage', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async updateVehicleDamage(
    data: VehicleDamageDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId, tenantId: tenant.id },
      });

      if (!vehicle) {
        this.logger.warn(
          `Vehicle with ID ${data.vehicleId} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Vehicle not found');
      }

      if (data.customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: data.customerId, tenantId: tenant.id },
        });

        if (!customer) {
          throw new NotFoundException('Customer not found');
        }
      }

      const existingDamage = await this.prisma.vehicleDamage.findUnique({
        where: { id: data.id, vehicleId: vehicle.id },
      });

      if (!existingDamage) {
        this.logger.warn(
          `Vehicle damage with ID ${data.id} not found for vehicle ${vehicle.id}`,
        );
        throw new NotFoundException('Vehicle damage not found');
      }

      await this.prisma.vehicleDamage.update({
        where: { id: data.id },
        data: {
          description: data.description,
          images: data.images,
          isRepaired: data.isRepaired,
          partId: data.partId,
          customerId: data.customerId || null,
          location: data.location,
          title: data.title,
          severity: data.severity,
          updatedAt: new Date(),
        },
      });

      const damages = await this.getVehicleDamages(vehicle.id, tenant);

      return {
        message: 'Vehicle damage updated successfully',
        damages,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update vehicle damage', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async deleteVehicleDamage(damageId: string, tenant: Tenant, user: User) {
    try {
      const existingDamage = await this.prisma.vehicleDamage.findUnique({
        where: { id: damageId, isDeleted: false },
        include: { vehicle: true },
      });

      if (!existingDamage) {
        this.logger.warn(
          `Damage record with ID ${damageId} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Damage record not found');
      }

      await this.prisma.vehicleDamage.update({
        where: { id: existingDamage.id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const damages = await this.getVehicleDamages(
        existingDamage.vehicleId,
        tenant,
      );

      return {
        message: 'Vehicle damage deleted successfully',
        damages,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting vehicle damage', {
        damageId,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }
}
