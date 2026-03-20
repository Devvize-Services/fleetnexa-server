import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserRoleDto, UserRolePermissionsDto } from './user-role.dto.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Tenant, User, UserRole } from '../../../../generated/prisma/client.js';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllRoles(tenant: Tenant) {
    try {
      return await this.prisma.userRole.findMany({
        where: { tenantId: tenant.id, show: true, isDeleted: false },
        include: {
          rolePermission: {
            include: {
              permission: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(error, 'Failed to get user roles', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getRoleByUser(tenant: Tenant, user: User) {
    try {
      if (!user.roleId) {
        this.logger.warn(
          `User ${user.id} does not have a role assigned in tenant ${tenant.tenantCode}`,
        );
        throw new BadRequestException('User does not have a role assigned');
      }

      const subscription = await this.prisma.tenantSubscription.findUnique({
        where: { tenantId: tenant.id },
        include: {
          plan: {
            include: {
              categories: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!subscription?.plan) {
        throw new BadRequestException(
          'Tenant does not have an active subscription plan',
        );
      }

      const allowedCategoryIds = subscription.plan.categories.map((c) => c.id);

      const role = await this.prisma.userRole.findUnique({
        where: { id: user.roleId },
        include: {
          rolePermission: {
            where: {
              permission: {
                categoryId: {
                  in: allowedCategoryIds,
                },
              },
            },
            include: {
              permission: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        this.logger.warn(
          `Role with ID ${user.roleId} not found for user ${user.id} in tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('User role not found');
      }

      return role;
    } catch (error) {
      throw error;
    }
  }

  async createUserRole(data: UserRoleDto, tenant: Tenant) {
    try {
      this.logger.debug('Creating new user role', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });

      const existingRole = await this.prisma.userRole.findFirst({
        where: { name: data.name, tenantId: tenant.id },
      });

      if (existingRole) {
        this.logger.warn('Role with this name already exists', {
          tenantId: existingRole.tenantId,
          roleName: existingRole.name,
        });
        throw new ConflictException('Role with this name already exists');
      }

      const role = await this.prisma.userRole.create({
        data: {
          name: data.name,
          description: data.description,
          show: data.show,
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const roles = await this.getAllRoles(tenant);

      return {
        message: 'Role created successfully',
        roles,
      };
    } catch (error) {
      this.logger.error(error, 'Error creating role', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async updateUserRole(data: UserRoleDto, tenant: Tenant, user: User) {
    try {
      const existingRole = await this.prisma.userRole.findUnique({
        where: { id: data.id, tenantId: tenant.id },
      });

      if (!existingRole) {
        this.logger.warn(
          `Role with ID ${data.id} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Role not found');
      }

      const role = await this.prisma.userRole.update({
        where: { id: data.id, tenantId: tenant.id },
        data: {
          name: data.name,
          description: data.description,
          show: data.show,
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const roles = await this.getAllRoles(tenant);

      return {
        message: 'Role created successfully',
        roles,
      };
    } catch (error) {
      this.logger.error(error, 'Error updating role', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async deleteUserRole(roleId: string, tenant: Tenant, user: User) {
    try {
      const existingRole = await this.prisma.userRole.findUnique({
        where: { id: roleId, tenantId: tenant.id },
      });

      if (!existingRole) {
        this.logger.warn(
          `Role with ID ${roleId} not found for tenant ${tenant.tenantCode}`,
        );
        throw new NotFoundException('Role not found');
      }

      const existingUsers = await this.prisma.user.count({
        where: { roleId, tenantId: tenant.id },
      });

      if (existingUsers > 0) {
        this.logger.warn(
          `Cannot delete role with ID ${roleId} because it is assigned to users in tenant ${tenant.tenantCode}`,
        );
        throw new UnauthorizedException('Cannot delete role assigned to users');
      }

      await this.prisma.userRole.update({
        where: { id: roleId },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const roles = await this.getAllRoles(tenant);

      return {
        message: 'Role created successfully',
        roles,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting role', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        roleId,
      });
      throw error;
    }
  }

  async assignPermissionsToRole(
    data: UserRolePermissionsDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const role = await tx.userRole.findUnique({
          where: { id: data.roleId, tenantId: tenant.id },
        });

        if (!role) {
          throw new Error('Role not found');
        }

        await tx.userRolePermission.createMany({
          data: data.permissions.map((permId) => ({
            roleId: role.id,
            permissionId: permId,
            assignedBy: user.username,
            assignedAt: new Date(),
          })),
          skipDuplicates: true,
        });
      });

      const roles = await this.getAllRoles(tenant);

      return {
        message: 'Permissions assigned successfully',
        roles,
      };
    } catch (error) {
      this.logger.error(error, 'Error assigning permissions to role', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }

  async createDefaultRole(tenant: Tenant) {
    try {
      const existingRole = await this.prisma.userRole.findFirst({
        where: {
          tenantId: tenant.id,
          name: 'Admin',
        },
      });

      if (existingRole) {
        this.logger.warn(
          `Default role 'Admin' already exists for tenant ${tenant.tenantCode}`,
        );
        return existingRole;
      }

      const role = await this.prisma.userRole.create({
        data: {
          name: 'Admin',
          description: 'Default admin role with all permissions',
          tenantId: tenant.id,
          show: true,
          createdAt: new Date(),
        },
      });

      await this.assignAllPermissionsToRole(role);

      return role;
    } catch (error) {
      this.logger.error('Failed to create default role', error);
      throw error;
    }
  }

  async assignAllPermissionsToRole(role: UserRole) {
    try {
      if (!role) {
        this.logger.warn('No role provided for permission assignment.');
        throw new BadRequestException('Role is required to assign permissions');
      }

      const permissions = await this.prisma.appPermission.findMany();

      await this.prisma.userRolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      });
    } catch (error) {
      this.logger.error('Failed to assign permissions to role', error);
      throw error;
    }
  }
}
