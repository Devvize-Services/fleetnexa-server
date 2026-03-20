import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TenantNotificationController } from './tenant-notification.controller.js';
import { TenantNotificationService } from './tenant-notification.service.js';
import { SocketModule } from '../../../gateway/socket.module.js';
import jwtConfig from '../../../config/jwt.config.js';

@Module({
  imports: [
    SocketModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [TenantNotificationController],
  providers: [TenantNotificationService],
  exports: [TenantNotificationService],
})
export class TenantNotificationModule {}
