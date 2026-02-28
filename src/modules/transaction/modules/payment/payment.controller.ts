import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import type { AuthenticatedRequest } from '../../../../types/authenticated-request.js';
import { PaymentDto } from './payment.dto.js';
import { LocalAuthGuard } from '../../../auth/guards/local.guard.js';

@Controller('transaction/payment')
@UseGuards(LocalAuthGuard)
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  getPayments(@Request() req) {
    const { tenant } = req.user;
    return this.service.getPayments(tenant);
  }

  @Post()
  createPayment(@Request() req, @Body() data: PaymentDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.createPayment(data, tenant, user);
  }

  @Put()
  updatePayment(@Request() req, @Body() data: PaymentDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updatePayment(data, tenant, user);
  }
}
