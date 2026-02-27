import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import jwtConfig from '../../config/jwt.config.js';
import { PassportModule } from '@nestjs/passport';
import { TenantUserRepository } from '../user/tenant-user/tenant-user.repository.js';
import { TenantStrategy } from './strategies/tenant.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { TenantRepository } from '../tenant/tenant.repository.js';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    PassportModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TenantUserRepository,
    TenantRepository,
    TenantStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
