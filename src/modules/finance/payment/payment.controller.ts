import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Put,
  Res,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { Role } from '../../../shared/enums/role.enum';
import { Roles } from '../../../modules/auth/decorator/role.decorator';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { PaymentDto } from './payment.dto';

@Controller('finance/payments')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  getPayments(@Request() req) {
    const { tenant } = req.user;
    return this.paymentService.getPayments(tenant);
  }

  @Get('receipts')
  getPaymentReceipts(@Request() req) {
    const { tenant } = req.user;
    return this.paymentService.getPaymentReceipts(tenant);
  }

  @Get('receipt/:accessToken')
  async getInvoiceByToken(
    @Param('accessToken') accessToken: string,
    @Res() res: Response,
  ) {
    const url = await this.paymentService.getPaymentReceiptByToken(accessToken);

    return res.redirect(url);
  }

  @Post()
  createPayment(
    @Request() req,
    @Body() data: PaymentDto,
    @Res() res: Response,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.paymentService.createPayment(data, tenant, user, res);
  }

  @Post('generate/receipt/:paymentId')
  generatePaymentReceipt(
    @Param('paymentId') paymentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.paymentService.generatePaymentReceipt(
      paymentId,
      tenant,
      user,
      res,
    );
  }

  @Put()
  updatePayment(
    @Request() req,
    @Body() data: PaymentDto,
    @Res() res: Response,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.paymentService.updatePayment(data, tenant, user, res);
  }
}
