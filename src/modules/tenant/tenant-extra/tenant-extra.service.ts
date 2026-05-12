import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenantLocationService } from '../tenant-location/tenant-location.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Tenant, User } from '../../../generated/prisma/client.js';
import { TenantExtra } from '../../../types/tenant.js';
import { TenantExtraDto } from './tenant-extra.dto.js';

@Injectable()
export class TenantExtraService {
  private readonly logger = new Logger(TenantLocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantExtras(tenant: Tenant) {
    try {
      const [tenantServices, tenantEquipments, tenantInsurances] =
        await Promise.all([
          this.prisma.tenantService.findMany({
            where: { tenantId: tenant.id, isDeleted: false },
            include: { service: true },
          }),
          this.prisma.tenantEquipment.findMany({
            where: { tenantId: tenant.id, isDeleted: false },
            include: { equipment: true },
          }),
          this.prisma.tenantInsurance.findMany({
            where: { tenantId: tenant.id, isDeleted: false },
          }),
        ]);

      const combined: TenantExtra[] = [
        ...tenantServices.map((item) => ({
          ...item,
          type: 'service' as const,
          item: item.service.id,
          name: item.service.service,
          icon: item.service.icon,
          description: item.service.description,
        })),
        ...tenantInsurances.map((item) => ({
          ...item,
          type: 'insurance' as const,
          item: item.insurance,
          name: item.insurance,
          icon: 'FaShieldAlt',
          description: item.description,
        })),
        ...tenantEquipments.map((item) => ({
          ...item,
          type: 'equipment' as const,
          item: item.equipment.id,
          name: item.equipment.equipment,
          icon: item.equipment.icon,
          description: item.equipment.description,
        })),
      ];

      return combined;
    } catch (error) {
      this.logger.error('Failed to get tenant extras', error);
      throw error;
    }
  }

  async createTenantExtra(data: TenantExtraDto, tenant: Tenant, user: User) {
    try {
      if (data.type === 'service') {
        const existingService = await this.prisma.service.findFirst({
          where: {
            id: data.item,
          },
        });

        if (!existingService) {
          this.logger.warn(`Service with ID ${data.item} not found`);
          throw new NotFoundException('Service not found');
        }

        await this.prisma.tenantService.create({
          data: {
            id: data.id,
            serviceId: data.item,
            tenantId: tenant.id,
            pricePolicy: data.pricePolicy,
            price: data.price,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      } else if (data.type === 'equipment') {
        const existingEquipment = await this.prisma.equipment.findFirst({
          where: {
            id: data.item,
          },
        });

        if (!existingEquipment) {
          throw new Error('Equipment not found');
        }

        await this.prisma.tenantEquipment.create({
          data: {
            id: data.id,
            equipmentId: data.item,
            tenantId: tenant.id,
            pricePolicy: data.pricePolicy,
            price: data.price,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      } else if (data.type === 'insurance') {
        const existingInsurance = await this.prisma.tenantInsurance.findFirst({
          where: {
            id: data.id,
            tenantId: tenant.id,
            insurance: data.item,
            isDeleted: false,
          },
        });

        if (existingInsurance) {
          throw new Error('Insurance already exists for this tenant');
        }

        await this.prisma.tenantInsurance.create({
          data: {
            insurance: data.item,
            description: data.description || '',
            tenantId: tenant.id,
            pricePolicy: data.pricePolicy,
            price: data.price,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      } else {
        this.logger.warn(`Invalid tenant extra type: ${data.type}`);
        throw new BadRequestException('Invalid tenant extra type');
      }

      const extras = await this.getTenantExtras(tenant);
      return {
        message: 'Tenant extra created successfully',
        extras,
      };
    } catch (error) {
      this.logger.error('Failed to create tenant extra', error);
      throw error;
    }
  }

  async updateTenantExtra(data: TenantExtraDto, tenant: Tenant, user: User) {
    try {
      if (data.type === 'service') {
        const existingService = await this.prisma.tenantService.findFirst({
          where: {
            id: data.id,
            tenantId: tenant.id,
            isDeleted: false,
          },
        });

        if (!existingService) {
          throw new NotFoundException('Tenant service not found');
        }

        await this.prisma.tenantService.update({
          where: { id: data.id },
          data: {
            pricePolicy: data.pricePolicy,
            price: data.price,
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      } else if (data.type === 'equipment') {
        const existingEquipment = await this.prisma.tenantEquipment.findFirst({
          where: {
            id: data.id,
            tenantId: tenant.id,
            isDeleted: false,
          },
        });

        if (!existingEquipment) {
          throw new NotFoundException('Tenant equipment not found');
        }

        await this.prisma.tenantEquipment.update({
          where: { id: data.id },
          data: {
            pricePolicy: data.pricePolicy,
            price: data.price,
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      } else if (data.type === 'insurance') {
        const existingInsurance = await this.prisma.tenantInsurance.findFirst({
          where: {
            id: data.id,
            tenantId: tenant.id,
            isDeleted: false,
          },
        });

        if (!existingInsurance) {
          throw new NotFoundException('Tenant insurance not found');
        }

        await this.prisma.tenantInsurance.update({
          where: { id: data.id },
          data: {
            description: data.description || '',
            pricePolicy: data.pricePolicy,
            price: data.price,
            updatedAt: new Date(),
            updatedBy: user.username,
          },
        });
      } else {
        this.logger.warn(`Invalid tenant extra type: ${data.type}`);
        throw new BadRequestException('Invalid tenant extra type');
      }

      const extras = await this.getTenantExtras(tenant);
      return {
        message: 'Tenant extra created successfully',
        extras,
      };
    } catch (error) {
      this.logger.error('Failed to update tenant extra', error);
      throw error;
    }
  }

  async deleteService(id: string, tenant: Tenant, user: User) {
    try {
      const existingService = await this.prisma.tenantService.findFirst({
        where: {
          id: id,
          tenantId: tenant.id,
          isDeleted: false,
        },
      });

      if (!existingService) {
        throw new Error('Tenant service not found');
      }

      await this.prisma.tenantService.update({
        where: { id: id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const extras = await this.getTenantExtras(tenant);
      return {
        message: 'Tenant extra created successfully',
        extras,
      };
    } catch (error) {
      this.logger.error('Failed to delete tenant service', error);
      throw new Error('Failed to delete tenant service');
    }
  }

  async deleteEquipment(id: string, tenant: Tenant, user: User) {
    try {
      const existingEquipment = await this.prisma.tenantEquipment.findFirst({
        where: {
          id: id,
          tenantId: tenant.id,
          isDeleted: false,
        },
      });

      if (!existingEquipment) {
        throw new Error('Tenant equipment not found');
      }

      await this.prisma.tenantEquipment.update({
        where: { id: id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const extras = await this.getTenantExtras(tenant);
      return {
        message: 'Tenant extra deleted successfully',
        extras,
      };
    } catch (error) {
      this.logger.error('Failed to delete tenant equipment', error);
      throw new Error('Failed to delete tenant equipment');
    }
  }

  async deleteInsurance(id: string, tenant: Tenant, user: User) {
    try {
      const existingInsurance = await this.prisma.tenantInsurance.findFirst({
        where: {
          id: id,
          tenantId: tenant.id,
          isDeleted: false,
        },
      });

      if (!existingInsurance) {
        throw new Error('Tenant insurance not found');
      }

      await this.prisma.tenantInsurance.update({
        where: { id: id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const extras = await this.getTenantExtras(tenant);
      return {
        message: 'Tenant extra deleted successfully',
        extras,
      };
    } catch (error) {
      this.logger.error('Failed to delete tenant insurance', error);
      throw new Error('Failed to delete tenant insurance');
    }
  }
}
