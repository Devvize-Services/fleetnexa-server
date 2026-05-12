import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  @Post('subscribe/:productId')
  async createSubscription(
    @Param('productId') productId: string,
    @Request() req,
  ) {
    const { tenant } = req.user;

    return this.paymentService.createSubscriptionSession(productId, tenant);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.paymentService.handleWebhook(body);
  }
}
