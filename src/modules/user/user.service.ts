import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { EmailService } from '../../common/email/email.service.js';
import { GeneratorService } from '../../common/generator/generator.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { VerifyOTPDto } from '../auth/dto/verify-otp.dto.js';
import { NewPasswordDto } from '../auth/dto/new-password.dto.js';
import { Tenant } from '../../generated/prisma/browser.js';
import { UserRepository } from './user.repository.js';
import { TenantUserDto } from './dto/tenant-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { OtpService } from '../auth/services/otp.service.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
    private readonly repo: UserRepository,
    private readonly email: EmailService,
    private readonly otpService: OtpService,
  ) {}

  async getTenantUsers(tenant: Tenant) {
    try {
      const users = await this.repo.getTenantUsers(tenant.id);

      return users;
    } catch (error) {
      this.logger.error('Error fetching tenant users', error, {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getCurrentUser(id: string, role: string) {
    if (role === 'TENANT') {
      return this.getTenantUser(id);
    } else if (role === 'ADMIN') {
      return this.getAdminUser(id);
    } else if (role === 'STOREFRONT') {
      return this.getStorefrontUser(id);
    }

    this.logger.warn(`Unsupported role ${role} provided for user ${id}.`);
    throw new UnauthorizedException('Invalid role');
  }

  async getTenantUser(id: string) {
    try {
      const user = await this.repo.getTenantUserById(id);

      if (!user) {
        this.logger.warn(`User with ID ${id} not found.`);
        return new UnauthorizedException('User not found');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });

      if (!tenant) {
        this.logger.warn(
          `Tenant with ID ${user.tenantId} not found for user ${id}.`,
        );
        return new UnauthorizedException('Tenant not found');
      }

      let role: any = null;

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
        this.logger.warn(
          `No active subscription plan found for tenant ${tenant.tenantCode}`,
        );
        role = await this.prisma.userRole.findUnique({
          where: { id: user.roleId },
          include: {
            rolePermission: {
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
      } else {
        const allowedCategoryIds = subscription.plan.categories.map(
          (c) => c.id,
        );

        role = await this.prisma.userRole.findUnique({
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
      }

      if (!role) {
        this.logger.warn(
          `Role with ID ${user.roleId} not found for user ${id}.`,
        );
        return new NotFoundException('User role not found');
      }

      const userData = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        fullName: `${user.firstName} ${user.lastName}`,
        tenantId: user.tenantId,
        tenant: user.tenant?.tenantCode,
        tenantName: user.tenant?.tenantName,
        createdAt: user.createdAt,
        email: user.email,
        profilePicture: user.profilePicture || null,
        roleId: user.roleId,
        requirePasswordChange: user.requirePasswordChange,
        role,
      };

      return userData;
    } catch (error) {
      this.logger.error(error, 'Error fetching current user', {
        userId: id,
      });
      throw error;
    }
  }

  async getAdminUser(id: string) {
    try {
      const user = await this.prisma.adminUser.findUnique({
        where: { id },
      });

      if (!user) {
        this.logger.warn(`Admin user with ID ${id} not found.`);
        return new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        fullName: `${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt,
        email: user.email,
      };
    } catch (error) {
      this.logger.error(error, 'Error fetching admin user', {
        userId: id,
      });
      throw error;
    }
  }

  async getStorefrontUser(id: string) {
    try {
      const user = await this.prisma.storefrontUser.findUnique({
        where: { id },
        include: {
          country: true,
          state: true,
          village: true,
        },
      });

      if (!user) {
        this.logger.warn(`Storefront user with ID ${id} not found.`);
        return new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        fullName: `${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt,
        email: user.email,
        profilePicture: user.profilePicture || null,
        driverLicenseNumber: user.driverLicenseNumber,
        licenseExpiry: user.licenseExpiry,
        licenseIssued: user.licenseIssued,
        license: user.license,
        country: user.country?.country,
        countryId: user.countryId,
        street: user.street,
        village: user.village?.village,
        villageId: user.villageId,
        state: user.state?.state,
        stateId: user.stateId,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
      };
    } catch (error) {
      this.logger.error(error, 'Error fetching storefront user', {
        userId: id,
      });
      throw error;
    }
  }

  async createTenantUser(data: TenantUserDto, tenant: Tenant) {
    try {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email, tenantId: tenant.id },
      });

      if (emailExists) {
        this.logger.warn(
          `User creation failed: Email ${data.email} is already in use.`,
        );
        throw new ConflictException(
          'Email is already associated with another user.',
        );
      }

      const username = await this.generator.generateUsername(
        data.firstName,
        data.lastName,
      );

      const salt = await bcrypt.genSalt(10);
      let hashedPassword: string;
      let password: string | undefined;

      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, salt);
      } else {
        password = await this.generator.generateTempPassword();
        hashedPassword = await bcrypt.hash(password, salt);
      }

      if (!data.roleId) {
        this.logger.warn(
          `User creation failed: roleId is required but not provided.`,
        );
        throw new BadRequestException('Role is required.');
      }

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          username,
          password: hashedPassword,
          tenantId: tenant.id,
          requirePasswordChange: true,
          roleId: data.roleId,
          createdAt: new Date(),
        },
      });

      if (password) {
        this.logger.log(`Sending welcome email to new user ${user.email}`);
        await this.email.sendNewUserWelcomeEmail(user.id, password, tenant);
      }

      const users = await this.repo.getTenantUsers(tenant.id);
      return {
        message: 'User created successfully',
        user,
        users,
      };
    } catch (error) {
      this.logger.error('Failed to create tenant user', error);
      throw error;
    }
  }

  async updateTenantUser(data: TenantUserDto, tenant: Tenant) {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { id: data.id, tenantId: tenant.id },
        });

        if (!existingUser) {
          this.logger.warn(
            `User update failed: User with ID ${data.id} not found.`,
          );
          throw new NotFoundException('User not found');
        }

        const emailOwner = await tx.user.findUnique({
          where: { email: data.email, tenantId: tenant.id },
        });

        if (emailOwner && emailOwner.id !== data.id) {
          this.logger.warn(
            `User update failed: Email ${data.email} is already in use by another user.`,
          );
          throw new ConflictException(
            'Email is already associated with another user.',
          );
        }

        const updatedUser = await tx.user.update({
          where: { id: data.id },
          data: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roleId: data.roleId,
            profilePicture: data.profilePicture,
            updatedAt: new Date(),
          },
        });

        return updatedUser;
      });

      const users = await this.repo.getTenantUsers(tenant.id);
      return {
        message: 'User updated successfully',
        user,
        users,
      };
    } catch (error) {
      this.logger.error('Failed to update tenant user', data);
      throw error;
    }
  }

  async deleteTenantUser(userId: string, tenant: Tenant) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId, tenantId: tenant.id },
      });

      if (!existingUser) {
        this.logger.warn(
          `User deletion failed: User with ID ${userId} not found.`,
        );
        throw new NotFoundException('User not found');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true, updatedAt: new Date() },
      });

      const users = await this.repo.getTenantUsers(tenant.id);
      return {
        message: 'User deleted successfully',
        users,
      };
    } catch (error) {
      this.logger.error('Failed to delete tenant user', error, {
        userId,
        tenantId: tenant.id,
      });
      throw error;
    }
  }

  async deleteStorefrontUser(userId: string, password: string) {
    try {
      const existingUser = await this.prisma.storefrontUser.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        this.logger.warn(
          `Storefront user deletion failed: User with ID ${userId} not found.`,
        );
        throw new NotFoundException(
          'Your account could not be found. It may have already been deleted.',
        );
      }

      const isMatch = await bcrypt.compare(password, existingUser.password);

      if (!isMatch) {
        throw new UnauthorizedException(
          'Please provide the correct password to delete your account',
        );
      }

      await this.prisma.storefrontUser.update({
        where: { id: userId },
        data: { isDeleted: true, updatedAt: new Date() },
      });

      return {
        message: 'Your account has been deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete storefront user', error, {
        userId,
      });
      throw error;
    }
  }

  async updateUserPassword(
    data: ChangePasswordDto,
    tenant: Tenant,
    userId: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        this.logger.warn(
          `Password update failed: User with ID ${userId} not found.`,
        );
        throw new NotFoundException('User not found');
      }

      const isMatch = await bcrypt.compare(data.currentPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const isSamePassword = await bcrypt.compare(
        data.newPassword,
        user.password,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'Password cannot be the same as the current password',
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.newPassword, salt);

      await this.prisma.user.update({
        where: {
          id: userId,
          tenantId: tenant.id,
        },
        data: {
          password: hashedPassword,
          requirePasswordChange: false,
        },
      });
    } catch (error) {
      this.logger.error('Failed to update user password', error, {
        userId,
        tenantId: tenant.id,
      });
      throw error;
    }
  }

  async changeTenantUserPassword(data: NewPasswordDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!existingUser) {
        this.logger.warn(
          `Password change requested for non-existent email: ${data.email}`,
        );
        throw new NotFoundException('User not found');
      }

      const isSamePassword = await bcrypt.compare(
        data.password,
        existingUser.password,
      );

      if (isSamePassword) {
        this.logger.warn(
          `User with email ${data.email} attempted to change to the same password.`,
        );
        throw new BadRequestException(
          'New password must be different from any previous passwords',
        );
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await this.prisma.user.update({
        where: { email: data.email },
        data: {
          password: hashedPassword,
          requirePasswordChange: false,
        },
      });

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(error, 'Error changing tenant user password', {
        email: data.email,
      });
      throw error;
    }
  }
}
