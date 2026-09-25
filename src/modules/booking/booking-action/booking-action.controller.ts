import {
  UseGuards,
  Request,
  Param,
  Body,
  Post,
  Controller,
} from '@nestjs/common';
import { BookingActionService } from './booking-action.service';
import { ActionBookingDto } from './action-booking.dto';
import { Roles } from '../../../modules/auth/decorator/role.decorator';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from '../../../shared/enums/role.enum';

@Controller('booking/action')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class BookingActionController {
  constructor(private readonly bookingActionService: BookingActionService) {}

  @Post('confirm')
  async confirmBooking(@Request() req, @Body() data: ActionBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingActionService.confirmBooking(data, tenant, user);
  }

  @Post('decline/:id')
  async declineBooking(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingActionService.declineBooking(id, tenant, user);
  }

  @Post('cancel/:id')
  async cancelBooking(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingActionService.cancelBooking(id, tenant, user, req);
  }

  @Post('start')
  async startBooking(@Request() req, @Body() data: ActionBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingActionService.startBooking(data, tenant, user, req);
  }

  @Post('end')
  async endBooking(@Request() req, @Body() data: ActionBookingDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.bookingActionService.endBooking(data, tenant, user, req);
  }
}
