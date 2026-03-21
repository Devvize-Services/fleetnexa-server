import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../../../config/jwt.config.js';
import { TenantRepository } from '../../../modules/tenant/tenant.repository.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UserRepository } from '../../../modules/user/user.repository.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userRepo: UserRepository,
    private tenantRepo: TenantRepository,
    private readonly prisma: PrismaService,
    @Inject(jwtConfig.KEY)
    private config: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.secret as string,
    });
  }

  async validate(payload: any) {
    if (payload.role === 'TENANT_USER') {
      return this.validateTenantUser(payload);
    } else if (payload.role === 'ADMIN') {
      return this.validateAdminUser(payload);
    } else if (payload.role === 'STOREFRONT') {
      return this.validateStorefrontUser(payload);
    }

    throw new UnauthorizedException('Invalid JWT payload: unrecognized role');
  }

  async validateTenantUser(payload: any) {
    const tenantUser = await this.userRepo.getTenantUserById(payload.sub);
    if (!tenantUser) throw new UnauthorizedException('Tenant user not found');

    const tenant = await this.tenantRepo.getTenantById(payload.tenantId);
    if (!tenant) throw new UnauthorizedException('Tenant not found');

    return { ...tenantUser, tenant, serverRole: payload.role };
  }

  async validateAdminUser(payload: any) {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!adminUser) throw new UnauthorizedException('Admin user not found');

    return { ...adminUser, serverRole: payload.role };
  }

  async validateStorefrontUser(payload: any) {
    const storefrontUser = await this.prisma.storefrontUser.findUnique({
      where: { id: payload.sub },
    });

    if (!storefrontUser)
      throw new UnauthorizedException('Storefront user not found');

    return { ...storefrontUser, serverRole: payload.role };
  }

  static cookieExtractor = (req: any): string | null => {
    return req?.cookies?.access_token || null;
  };
}
