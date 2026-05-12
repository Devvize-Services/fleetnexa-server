import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TransactionModule } from '../../transaction.module.js';
import { RefundController } from './refund.controller.js';
import { RefundService } from './refund.service.js';
import { TenantRepository } from '../../../../modules/tenant/tenant.repository.js';
import jwtConfig from '../../../../config/jwt.config.js';
import { BookingRepository } from '../../../../modules/booking/booking.repository.js';
import { PrismaModule } from '../../../../prisma/prisma.module.js';
import { UserRepository } from '../../../../modules/user/user.repository.js';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => TransactionModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [RefundController],
  providers: [
    RefundService,
    TenantRepository,
    UserRepository,
    BookingRepository,
  ],
  exports: [RefundService],
})
export class RefundModule {}
