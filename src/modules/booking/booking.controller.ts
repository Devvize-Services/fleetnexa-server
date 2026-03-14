import {
  Controller,
  Get,
  Req,
  UseGuards,
  Request,
  Param,
  Body,
  Post,
  Put,
} from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { ActionBookingDto } from './dto/action-booking.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('tenant')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async getTenantBookings(@Request() req) {
    const { tenant } = req.user;
    return this.bookingService.getBookings(tenant);
  }

  @Get('code/:bookingCode')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async getBookingByCode(@Param('bookingCode') bookingCode: string) {
    return this.bookingService.getBookingByCode(bookingCode);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async getBookingById(@Param('id') id: string, @Request() req) {
    const { tenant } = req.user;
    return this.bookingService.getBookingById(id);
  }

  @Post('tenant')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async createBooking(@Request() req, @Body() data: CreateBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.createTenantBooking(data, tenant, user);
  }

  @Put('tenant')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async updateBooking(@Request() req, @Body() data: UpdateBookingDto) {
    const { tenant, user } = req.user;
    return this.bookingService.updateBooking(data, tenant, user);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async confirmBooking(@Request() req, @Body() data: ActionBookingDto) {
    const { tenant, user } = req.user;
    return this.bookingService.confirmBooking(data, tenant, user);
  }

  @Post('decline/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async declineBooking(@Request() req, @Param('id') id: string) {
    const { tenant, user } = req.context;
    return this.bookingService.declineBooking(id, tenant, user);
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async cancelBooking(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.cancelBooking(id, tenant, user);
  }

  @Post('start')
  async startBooking(@Request() req, @Body() data: ActionBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.startBooking(data, tenant, user);
  }

  @Post('end')
  async endBooking(@Request() req, @Body() data: ActionBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.endBooking(data, tenant, user);
  }
}
