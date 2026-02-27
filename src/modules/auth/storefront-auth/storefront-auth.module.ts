import { Module } from '@nestjs/common';
import { StorefrontAuthController } from './storefront-auth.controller.js';
import { StorefrontAuthService } from './storefront-auth.service.js';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from '../../../config/jwt.config.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [StorefrontAuthController],
  providers: [StorefrontAuthService],
  exports: [StorefrontAuthService],
})
export class StorefrontAuthModule {}
