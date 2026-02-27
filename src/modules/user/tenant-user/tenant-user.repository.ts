import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class TenantUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  getUsers = async (
    tenantId: string,
    additionalWhere?: Prisma.UserWhereInput,
  ) => {
    return await this.prisma.user.findMany({
      where: { tenantId, ...additionalWhere, isDeleted: false, show: true },
      select: this.getUserSelectOptions(),
    });
  };

  getUserById = async (id: string) => {
    return await this.prisma.user.findUnique({
      where: { id },
      select: this.getUserSelectOptions(),
    });
  };

  getUserByEmail = async (email: string) => {
    return await this.prisma.user.findUnique({
      where: { email },
      select: this.getUserAuthSelectOptions(),
    });
  };

  getUserByUsername = async (username: string) => {
    return await this.prisma.user.findUnique({
      where: { username },
      select: this.getUserAuthSelectOptions(),
    });
  };

  private getUserAuthSelectOptions(): Prisma.UserSelect {
    return {
      ...this.getUserSelectOptions(),
      password: true,
    };
  }

  private getUserSelectOptions(): Prisma.UserSelect {
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
