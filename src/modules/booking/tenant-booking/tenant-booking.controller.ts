import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantBookingService } from './tenant-booking.service.js';
import type { AuthenticatedRequest } from 'src/types/authenticated-request.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';
import { ActionBookingDto } from '../dto/action-booking.dto.js';
import { SendDocumentsDto } from './dto/send-documents.dto.js';
import { LocalAuthGuard } from '../../auth/guards/local.guard.js';

@Controller('tenant/booking')
@UseGuards(LocalAuthGuard)
export class TenantBookingController {
  constructor(private readonly service: TenantBookingService) {}

  @Get()
  async getBookings(@Req() req: AuthenticatedRequest) {
    const { tenant } = req.context;
    return this.service.getBookings(tenant);
  }

  @Get('code/:bookingCode')
  async getBookingByCode(
    @Param('bookingCode') bookingCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.service.getBookingByCode(bookingCode, tenant);
  }

  @Get(':id')
  async getBookingById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.service.getBookingById(id, tenant);
  }

  @Post('confirm')
  async confirmBooking(
    @Req() req: AuthenticatedRequest,
    @Body() data: ActionBookingDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.confirmBooking(data, tenant, user);
  }

  @Post('start')
  async startBooking(
    @Req() req: AuthenticatedRequest,
    @Body() data: ActionBookingDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.startBooking(data, tenant, user);
  }

  @Post('end')
  async endBooking(
    @Req() req: AuthenticatedRequest,
    @Body() data: ActionBookingDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.endBooking(data, tenant, user);
  }

  @Post('decline/:id')
  async declineBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { tenant, user } = req.context;
    return this.service.declineBooking(id, tenant, user);
  }

  @Post('cancel/:id')
  async cancelBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { tenant, user } = req.context;
    return this.service.cancelBooking(id, tenant, user);
  }

  @Post()
  async createBooking(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateBookingDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.createBooking(data, tenant, user);
  }

  @Post('send-documents')
  async sendBookingDocuments(
    @Req() req: AuthenticatedRequest,
    @Body() data: SendDocumentsDto,
  ) {
    const { tenant } = req.context;
    return this.service.sendBookingDocuments(data, tenant);
  }

  @Put()
  async updateBooking(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateBookingDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateBooking(data, tenant, user);
  }

  @Delete(':id')
  async deleteBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { tenant, user } = req.context;
    return this.service.deleteBooking(id, tenant, user);
  }
}
