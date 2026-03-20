import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/browser.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  getTenantUsers = async (
    tenantId: string,
    additionalWhere?: Prisma.UserWhereInput,
  ) => {
    return await this.prisma.user.findMany({
      where: { tenantId, ...additionalWhere, isDeleted: false, show: true },
      select: this.getTenantUserSelectOptions(),
    });
  };

  getTenantUserById = async (id: string) => {
    return await this.prisma.user.findUnique({
      where: { id },
      select: this.getTenantUserSelectOptions(),
    });
  };

  getTenantUserByEmail = async (email: string) => {
    return await this.prisma.user.findUnique({
      where: { email },
      select: this.getTenantUserAuthSelectOptions(),
    });
  };

  getTenantUserByUsername = async (username: string) => {
    return await this.prisma.user.findUnique({
      where: { username },
      select: this.getTenantUserAuthSelectOptions(),
    });
  };

  protected getTenantUserAuthSelectOptions(): Prisma.UserSelect {
    return {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      tenantId: true,
      createdAt: true,
      password: true,
      email: true,
      roleId: true,
      requirePasswordChange: true,
      role: {
        include: {
          rolePermission: {
            include: {
              permission: true,
            },
          },
        },
      },
    };
  }

  private getTenantUserSelectOptions(): Prisma.UserSelect {
    return {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      tenantId: true,
      createdAt: true,
      email: true,
      roleId: true,
      requirePasswordChange: true,
      role: {
        include: {
          rolePermission: {
            include: {
              permission: true,
            },
          },
        },
      },
    };
  }
}
