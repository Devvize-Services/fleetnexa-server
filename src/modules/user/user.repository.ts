import { Injectable } from '@nestjs/common';
import { Prisma, UserType } from '../../generated/prisma/browser.js';
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

  getAllTenantUsers = async (tenantId: string) => {
    return await this.prisma.user.findMany({
      where: { tenantId, isDeleted: false },
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

  getAnyUserByUsername = async (username: string, userType: UserType) => {
    if (userType === 'TENANT') {
      if (username.includes('@')) {
        return await this.getTenantUserByEmail(username);
      } else {
        return await this.getTenantUserByUsername(username);
      }
      return await this.getTenantUserByUsername(username);
    } else if (userType === 'STOREFRONT') {
      return await this.prisma.storefrontUser.findUnique({
        where: { email: username },
        select: this.getStorefrontUserSelectOptions(),
      });
    } else {
      return await this.prisma.adminUser.findUnique({
        where: { email: username },
      });
    }
  };

  createStorefrontUser = async (data: any) => {
    return await this.prisma.storefrontUser.create({
      data,
      select: this.getStorefrontUserSelectOptions(),
    });
  };

  getAnyUserByEmail = async (email: string, userType: UserType) => {
    if (userType === 'TENANT') {
      return await this.getTenantUserByEmail(email);
    } else if (userType === 'STOREFRONT') {
      return await this.prisma.storefrontUser.findUnique({
        where: { email },
        select: this.getStorefrontUserSelectOptions(),
      });
    } else {
      return await this.prisma.adminUser.findUnique({
        where: { email },
      });
    }
  };

  getAnyUserById = async (id: string, userType: UserType) => {
    if (userType === 'TENANT') {
      return await this.getTenantUserById(id);
    } else if (userType === 'STOREFRONT') {
      return await this.prisma.storefrontUser.findUnique({
        where: { id },
        select: this.getStorefrontUserSelectOptions(),
      });
    } else {
      return await this.prisma.adminUser.findUnique({
        where: { id },
      });
    }
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

  private getStorefrontUserSelectOptions(): Prisma.StorefrontUserSelect {
    return {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      email: true,
      profilePicture: true,
      driverLicenseNumber: true,
      licenseExpiry: true,
      licenseIssued: true,
      license: true,
      country: true,
      countryId: true,
      street: true,
      village: true,
      villageId: true,
      state: true,
      stateId: true,
      phone: true,
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
