import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAppPermission(data: CreatePermissionDto) {
    try {
      await this.prisma.appPermission.create({
        data: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
        },
      });

      const permissions = await this.getAllAppPermissions();

      return { message: 'Permission created successfully', permissions };
    } catch (error) {
      this.logger.error('Error creating permission:', error);
      throw error;
    }
  }

  async getAllAppPermissions() {
    try {
      const permissions = await this.prisma.appPermission.findMany({
        include: { category: true },
      });

      return permissions;
    } catch (error) {
      this.logger.error('Error fetching permissions:', error);
      throw error;
    }
  }

  async updateAppPermission(data: UpdatePermissionDto) {
    try {
      const existing = await this.prisma.appPermission.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        throw new NotFoundException('Permission not found');
      }

      await this.prisma.appPermission.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
        },
      });

      const permissions = await this.getAllAppPermissions();

      return {
        message: 'Permission updated successfully',
        permissions,
      };
    } catch (error) {
      this.logger.error('Error updating permission:', error);
      throw error;
    }
  }

  async deleteAppPermission(id: string) {
    try {
      const existing = await this.prisma.appPermission.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Permission not found');
      }

      await this.prisma.appPermission.delete({
        where: { id },
      });

      const permissions = await this.getAllAppPermissions();

      return {
        message: 'Permission deleted successfully',
        permissions,
      };
    } catch (error) {
      this.logger.error('Error deleting permission:', error);
      throw error;
    }
  }
}
