import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import bcrypt from 'bcrypt';
import { TenantUserRepository } from '../user/tenant-user/tenant-user.repository.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private tenantUserRepo: TenantUserRepository,
  ) {}

  async validateUser(username: string, password: string, role: string) {
    if (role === 'TENANT_USER') {
      return this.validateTenantUser(username, password);
    }

    this.logger.warn(`Unsupported role ${role} provided for user ${username}.`);
    throw new UnauthorizedException('Invalid role');
  }

  async validateTenantUser(username: string, password: string) {
    try {
      let user: any | null = null;

      user = username.includes('@')
        ? await this.tenantUserRepo.getUserByEmail(username)
        : await this.tenantUserRepo.getUserByUsername(username);

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
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  async loginTenantUser(userId: string) {
    try {
      const user = await this.tenantUserRepo.getUserById(userId);

      if (!user) {
        this.logger.warn(`Login failed: User with ID ${userId} not found.`);
        throw new UnauthorizedException('User not found');
      }

      const payload = { sub: user.id, tenantId: user.tenantId };

      const token = this.jwtService.sign(payload);

      return { token, user, role: 'TENANT_USER' };
    } catch (error) {
      this.logger.error(
        `Error logging in tenant user with ID ${userId}: ${error.message}`,
      );
      throw new UnauthorizedException('Login failed');
    }
  }
}
