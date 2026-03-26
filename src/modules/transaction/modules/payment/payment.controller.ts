import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { PaymentDto } from './payment.dto.js';
import { JwtAuthGuard } from '../../../../modules/auth/guards/jwt-auth.guard.js';
import { Roles } from '../../../../modules/auth/decorator/role.decorator.js';
import { Role } from '../../../../common/enums/role.enum.js';

@Controller('transaction/payment')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
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
