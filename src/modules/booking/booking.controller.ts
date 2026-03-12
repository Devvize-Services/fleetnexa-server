import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('tenant')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async getTenantBookings(@Request() req) {
    const { tenant } = req.user;

    console.log('Fetching bookings for tenant:', tenant.id, tenant.tenantCode);
    return this.bookingService.getBookings(tenant);
  }
}
