import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TenantGateway } from './tenant.gateway.js';
import jwtConfig from '../config/jwt.config.js';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  providers: [TenantGateway],
  exports: [TenantGateway],
})
export class SocketModule {}
