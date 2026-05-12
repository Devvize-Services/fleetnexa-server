import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Country, Tenant, User } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

import { v4 as uuidv4 } from 'uuid';
import { TenantLocationDto } from './tenant.location.dto.js';

@Injectable()
export class TenantLocationService {
  private readonly logger = new Logger(TenantLocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllTenantLocations(tenant: Tenant) {
    try {
      return this.prisma.tenantLocation.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
        include: {
          _count: {
            select: { vehicles: true },
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to get tenant locations', error);
      throw error;
    }
  }

  async createTenantLocation(data: TenantLocationDto, tenant: Tenant) {
    try {
      const existing = await this.prisma.tenantLocation.findFirst({
        where: {
          tenantId: tenant.id,
          location: {
            equals: data.location,
            mode: 'insensitive',
          },
          isDeleted: false,
        },
      });

      if (existing) {
        this.logger.warn(
          `Tenant location with name ${data.location} already exists for tenant ${tenant.tenantCode}`,
        );
        throw new ConflictException(
          'Tenant location with this name already exists',
        );
      }

      await this.prisma.tenantLocation.create({
        data: {
          id: uuidv4(),
          location: data.location,
          tenantId: tenant.id,
          pickupEnabled: data.pickupEnabled,
          returnEnabled: data.returnEnabled,
          storefrontEnabled: data.storefrontEnabled,
          deliveryFee: data.deliveryFee,
          collectionFee: data.collectionFee,
          minimumRentalPeriod: data.minimumRentalPeriod,
          updatedAt: new Date(),
          updatedBy: 'SYSTEM',
          isDeleted: false,
        },
      });

      const locations = await this.getAllTenantLocations(tenant);
      return {
        message: 'Location created successfully',
        locations,
      };
    } catch (error) {
      this.logger.error('Failed to create tenant location', error);
      throw error;
    }
  }

  async updateTenantLocation(
    data: TenantLocationDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const location = await this.prisma.tenantLocation.findUnique({
        where: { id: data.id, tenantId: tenant.id },
      });

      if (!location) {
        this.logger.warn(
          `Tenant location with id ${data.id} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Location not found');
      }

      await this.prisma.tenantLocation.update({
        where: { id: data.id, tenantId: tenant.id },
        data: {
          location: data.location,
          pickupEnabled: data.pickupEnabled,
          returnEnabled: data.returnEnabled,
          storefrontEnabled: data.storefrontEnabled,
          deliveryFee: data.deliveryFee,
          collectionFee: data.collectionFee,
          minimumRentalPeriod: data.minimumRentalPeriod,
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      });

      const locations = await this.getAllTenantLocations(tenant);
      return {
        message: 'Location updated successfully',
        locations,
      };
    } catch (error) {
      this.logger.error('Failed to update tenant location', error);
      throw error;
    }
  }

  async deleteTenantLocation(id: string, tenant: Tenant, user: User) {
    try {
      const location = await this.prisma.tenantLocation.findUnique({
        where: { id: id, tenantId: tenant.id },
      });

      if (!location) {
        this.logger.warn(
          `Tenant location with id ${id} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Tenant location not found');
      }

      await this.prisma.tenantLocation.update({
        where: { id: id, tenantId: tenant.id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      });

      const locations = await this.getAllTenantLocations(tenant);
      return {
        message: 'Tenant location deleted successfully',
        locations,
      };
    } catch (error) {
      this.logger.error('Failed to delete tenant location', error);
      throw error;
    }
  }

  async initializeTenantLocation(country: Country, tenant: Tenant) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const presetLocations = await tx.presetLocation.findMany({
          where: { countryId: country.id },
        });

        await tx.tenantLocation.create({
          data: {
            id: uuidv4(),
            location: 'Main Office',
            tenantId: tenant.id,
            pickupEnabled: true,
            returnEnabled: true,
            storefrontEnabled: true,
            deliveryFee: 0,
            collectionFee: 0,
            minimumRentalPeriod: 1,
            updatedAt: new Date(),
            updatedBy: 'SYSTEM',
            isDeleted: false,
          },
        });

        for (const location of presetLocations) {
          await tx.tenantLocation.create({
            data: {
              id: uuidv4(),
              location: location.location,
              tenantId: tenant.id,
              pickupEnabled: true,
              returnEnabled: true,
              deliveryFee: 0,
              collectionFee: 0,
              minimumRentalPeriod: 1,
              updatedAt: new Date(),
              updatedBy: 'SYSTEM',
              isDeleted: false,
            },
          });
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize tenant locations', error);
      throw error;
    }
  }
}
