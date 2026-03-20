import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  CreatePermissionCategoryDto,
  UpdatePermissionCategoryDto,
} from './permission-category.dto.js';

@Injectable()
export class PermissionCategoryService {
  private readonly logger = new Logger(PermissionCategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    try {
      return await this.prisma.permissionCategory.findMany({
        include: { _count: { select: { permissions: true } } },
      });
    } catch (error) {
      this.logger.error('Error fetching permission categories:', error);
      throw error;
    }
  }

  async createPermissionCategory(data: CreatePermissionCategoryDto) {
    try {
      const categoryInUse = await this.checkCategoryInUse(data.category);

      if (categoryInUse) {
        this.logger.warn(
          `Attempt to create category "${data.category}" that is already in use by existing permissions.`,
        );
        throw new ConflictException(
          'Cannot create category. It is already in use by existing permissions.',
        );
      }

      await this.prisma.permissionCategory.create({
        data: {
          name: data.category,
          description: data.description,
        },
      });

      const categories = await this.getAllCategories();

      return {
        message: 'Permission category created successfully',
        categories,
      };
    } catch (error) {
      this.logger.error('Error creating permission category:', error);
      throw error;
    }
  }

  async updatePermissionCategory(data: UpdatePermissionCategoryDto) {
    try {
      const existing = await this.prisma.permissionCategory.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        throw new NotFoundException('Permission category not found');
      }

      if (!data.category) {
        throw new ConflictException('Category name is required');
      }

      const categoryInUse = await this.checkCategoryInUse(data.category);

      if (categoryInUse) {
        this.logger.warn(
          `Attempt to create category "${data.category}" that is already in use by existing permissions.`,
        );
        throw new ConflictException(
          'Cannot create category. It is already in use by existing permissions.',
        );
      }

      await this.prisma.permissionCategory.update({
        where: { id: data.id },
        data: {
          name: data.category,
          description: data.description,
        },
      });

      const categories = await this.getAllCategories();

      return {
        message: 'Permission category updated successfully',
        categories,
      };
    } catch (error) {
      this.logger.error('Error updating permission category:', error);
      throw error;
    }
  }

  private async checkCategoryInUse(category: string): Promise<boolean> {
    const permissions = await this.prisma.appPermission.findMany({
      where: { category: { name: category } },
    });

    return permissions.length > 0;
  }
}
