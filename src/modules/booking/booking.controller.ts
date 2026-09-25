import {
  Get,
  UseGuards,
  Request,
  Param,
  Body,
  Post,
  Put,
  Delete,
  Controller,
} from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { Role } from '../../shared/enums/role.enum.js';
import { ActionBookingDto } from './booking-action/action-booking.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';
import { StorefrontUserBookingDto } from './dto/storefront-user-booking.dto.js';
import { StorefrontGuestBookingDto } from './dto/storefront-guest-booking.dto.js';
import { ApiGuard } from '../auth/guards/api.guard.js';
import { SwapVehicleDto } from './dto/swap-vehicle.dto.js';
import { CreateBookingChargeDto } from './dto/booking-charge.dto.js';
import { BookingDepositDto } from './dto/booking-deposit.dto.js';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getTenantBookings(@Request() req) {
    const { tenant } = req.user;
    return this.bookingService.getBookings(tenant);
  }

  @Get('code/:bookingCode')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getBookingByCode(@Param('bookingCode') bookingCode: string) {
    return this.bookingService.getBookingByCode(bookingCode);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getBookingById(@Param('id') id: string, @Request() req) {
    return this.bookingService.getBookingById(id);
  }

  @Get('storefront')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STOREFRONT)
  async getStorefrontUserBookings(@Request() req) {
    const user = req.user;
    return this.bookingService.getStorefrontBookings(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async createBooking(@Request() req, @Body() data: CreateBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.createTenantBooking(data, tenant, user);
  }

  @Post('storefront/user')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STOREFRONT)
  async createUserBooking(@Body() data: StorefrontUserBookingDto) {
    return this.bookingService.createStorefrontUserBooking(data);
  }

  @Post('storefront/guest')
  @UseGuards(ApiGuard)
  async createGuestBooking(@Body() data: StorefrontGuestBookingDto) {
    return this.bookingService.createStorefrontGuestBooking(data);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateBooking(@Request() req, @Body() data: UpdateBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.updateBooking(data, tenant, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async deleteBooking(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.deleteBooking(id, tenant, user);
  }

  @Post('vehicle/swap')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async swapVehicle(@Request() req, @Body() data: SwapVehicleDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.swapBookingVehicle(data, tenant, user);
  }

  @Post('charge')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async addBookingCharge(@Request() req, @Body() data: CreateBookingChargeDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingService.addBookingCharge(data, tenant.id, user.id);
  }
}
