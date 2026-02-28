import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../../../config/jwt.config.js';
import { TenantRepository } from '../../../modules/tenant/tenant.repository.js';
import { TenantUserRepository } from '../../../modules/user/tenant-user/tenant-user.repository.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userRepo: TenantUserRepository,
    private tenantRepo: TenantRepository,
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
    console.log('Validating JWT payload:', payload);

    const user = await this.userRepo.getUserById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    const tenant = await this.tenantRepo.getTenantById(payload.tenantId);
    if (!tenant) throw new UnauthorizedException('Tenant not found');

    return { ...user, tenant };
  }

  static cookieExtractor = (req: any): string | null => {
    console.log('Extracting JWT from cookies:', req?.cookies);

    return req?.cookies?.access_token || null;
  };
}
