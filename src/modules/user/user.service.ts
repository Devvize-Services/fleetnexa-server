import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from '../../common/email/email.service.js';
import { GeneratorService } from '../../common/generator/generator.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantUserRepository } from './tenant-user/tenant-user.repository.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
    private readonly repo: TenantUserRepository,
    private readonly email: EmailService,
  ) {}

  async getCurrentUser(id: string, role: string) {
    if (role === 'TENANT_USER') {
      return this.getTenantUser(id);
    }

    this.logger.warn(`Unsupported role ${role} provided for user ${id}.`);
    throw new UnauthorizedException('Invalid role');
  }

  async getTenantUser(id: string) {
    try {
      const user = await this.repo.getUserById(id);

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
        throw new NotFoundException(
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
}
