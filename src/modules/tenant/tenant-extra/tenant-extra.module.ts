import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TenantExtraService } from './tenant-extra.service.js';
import { TenantExtraController } from './tenant-extra.controller.js';
import { TenantRepository } from '../tenant.repository.js';
import { TenantUserRepository } from '../../user/tenant-user/tenant-user.repository.js';
import jwtConfig from '../../../config/jwt.config.js';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [TenantExtraController],
  providers: [TenantExtraService],
  exports: [TenantExtraService],
})
export class TenantExtrasModule {}
