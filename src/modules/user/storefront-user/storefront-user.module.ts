import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StorefrontUserController } from './storefront-user.controller.js';
import { StorefrontUserService } from './storefront-user.service.js';
import { StorefrontGuard } from '../../../common/guards/storefront.guard.js';
import jwtConfig from '../../../config/jwt.config.js';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [StorefrontUserController],
  providers: [StorefrontUserService, StorefrontGuard],
  exports: [StorefrontUserService],
})
export class StorefrontUserModule {}
