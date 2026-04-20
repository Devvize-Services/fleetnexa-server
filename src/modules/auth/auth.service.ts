import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user/user.repository.js';
import { StorefrontAuthDto } from './dto/storefront-auth.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
  ) {}

  async validateUser(username: string, password: string, role: string) {
    if (role === 'TENANT_USER') {
      return this.validateTenantUser(username, password);
    } else if (role === 'ADMIN') {
      return this.validateAdminUser(username, password);
    } else if (role === 'STOREFRONT') {
      return this.validateStorefrontUser(username, password);
    }

    this.logger.warn(`Unsupported role ${role} provided for user ${username}.`);
    throw new UnauthorizedException('Invalid role');
  }

  async validateTenantUser(username: string, password: string) {
    try {
      let user: any | null = null;

      user = username.includes('@')
        ? await this.userRepo.getTenantUserByEmail(username)
        : await this.userRepo.getTenantUserByUsername(username);

      if (!user) {
        this.logger.warn(`Login failed: User ${username} not found.`);
        throw new UnauthorizedException('Invalid username or password');
      }

      if (!user.password) {
        this.logger.warn(
          `Login failed: User ${username} does not have a password set.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        this.logger.warn(
          `Login failed: Invalid password for user ${username}.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId,
        role: 'TENANT_USER',
      };
    } catch (error) {
      this.logger.error(
        `Error validating tenant user ${username}: ${error.message}`,
      );
      throw error;
    }
  }

  async validateAdminUser(username: string, password: string) {
    try {
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { username },
      });

      if (!adminUser) {
        this.logger.warn(`Login failed: Admin user ${username} not found.`);
        throw new UnauthorizedException('Invalid username or password');
      }

      if (!adminUser.password) {
        this.logger.warn(
          `Login failed: Admin user ${username} does not have a password set.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      const passwordValid = await bcrypt.compare(password, adminUser.password);
      if (!passwordValid) {
        this.logger.warn(
          `Login failed: Invalid password for admin user ${username}.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      return {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: 'ADMIN',
      };
    } catch (error) {
      this.logger.error(
        `Error validating admin user ${username}: ${error.message}`,
      );
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  async validateStorefrontUser(username: string, password: string) {
    try {
      const storefrontUser = await this.prisma.storefrontUser.findUnique({
        where: { email: username },
      });

      if (!storefrontUser) {
        this.logger.warn(
          `Login failed: Storefront user ${username} not found.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      if (!storefrontUser.password) {
        this.logger.warn(
          `Login failed: Storefront user ${username} does not have a password set.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      const passwordValid = await bcrypt.compare(
        password,
        storefrontUser.password,
      );
      if (!passwordValid) {
        this.logger.warn(
          `Login failed: Invalid password for storefront user ${username}.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      return {
        id: storefrontUser.id,
        username: storefrontUser.email,
        email: storefrontUser.email,
        role: 'STOREFRONT',
      };
    } catch (error) {
      this.logger.error(
        `Error validating storefront user ${username}: ${error.message}`,
      );
      throw error;
    }
  }

  async loginTenantUser(userId: string) {
    try {
      const user = await this.userRepo.getTenantUserById(userId);

      if (!user) {
        this.logger.warn(`Login failed: User with ID ${userId} not found.`);
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user.id,
        tenantId: user.tenantId,
        role: 'TENANT_USER',
      };

      const token = this.jwtService.sign(payload);

      return { token, user, role: 'TENANT_USER' };
    } catch (error) {
      this.logger.error(
        `Error logging in tenant user with ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async loginAdminUser(userId: string) {
    try {
      const user = await this.prisma.adminUser.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(
          `Login failed: Admin user with ID ${userId} not found.`,
        );
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user.id,
        role: 'ADMIN',
      };

      const token = this.jwtService.sign(payload);

      return { token, user, role: 'ADMIN' };
    } catch (error) {
      this.logger.error(
        `Error logging in admin user with ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async loginStorefrontUser(userId: string) {
    try {
      const user = await this.prisma.storefrontUser.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(
          `Login failed: Storefront user with ID ${userId} not found.`,
        );
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user.id,
        role: 'STOREFRONT',
      };

      const token = this.jwtService.sign(payload);

      return { token, user, role: 'STOREFRONT' };
    } catch (error) {
      this.logger.error(
        `Error logging in storefront user with ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async createStorefrontUser(data: StorefrontAuthDto) {
    try {
      const [existingEmail, existingLicense] = await Promise.all([
        this.prisma.storefrontUser.findUnique({ where: { email: data.email } }),
        this.prisma.storefrontUser.findFirst({
          where: { driverLicenseNumber: data.licenseNumber },
        }),
      ]);

      if (existingEmail || existingLicense) {
        this.logger.warn('Registration conflict', {
          emailConflict: !!existingEmail,
          licenseConflict: !!existingLicense,
        });
        throw new ConflictException(
          'An account with these details already exists.',
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const user = await this.userRepo.createStorefrontUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: data.gender || 'male',
        phone: data.phone || '',
        password: hashedPassword,
        driverLicenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        licenseIssued: new Date(data.licenseIssued),
        license: data.license,
        dateOfBirth: data.dateOfBirth,
        street: data.street || '',
        countryId: data.countryId || null,
        stateId: data.stateId || null,
      });

      const payload = {
        sub: user.id,
        role: 'STOREFRONT',
      };

      const token = this.jwtService.sign(payload);

      return { token, user, role: 'STOREFRONT' };
    } catch (error) {
      this.logger.error('Error creating user', { error });
      throw error;
    }
  }
}
