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
  Request,
} from '@nestjs/common';
import { RefundService } from './refund.service.js';
import type { AuthenticatedRequest } from '../../../../types/authenticated-request.js';
import { RefundDto } from './refund.dto.js';
import { LocalAuthGuard } from '../../../auth/guards/local.guard.js';

@Controller('transaction/refund')
@UseGuards(LocalAuthGuard)
export class RefundController {
  constructor(private readonly service: RefundService) {}

  @Get()
  async getRefunds(@Request() req) {
    const tenant = req.user.tenant;
    return this.service.getTenantRefunds(tenant);
  }

  @Post()
  async createRefund(@Request() req, @Body() data: RefundDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.createRefund(data, tenant, user);
  }

  @Put()
  async updateRefund(@Request() req, @Body() data: RefundDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateRefund(data, tenant, user);
  }

  @Delete(':id')
  async deleteRefund(@Request() req, @Param('id') refundId: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteRefund(refundId, tenant, user);
  }
}
