import { Controller, Get, Req, UseGuards, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { TenantAuthGuard } from '../auth/guards/tenant-auth.guard.js';

@Controller('transaction')
@UseGuards(TenantAuthGuard)
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get()
  getTransactions(@Request() req) {
    const tenant = req.user.tenant;
    return this.service.getTransactions(tenant);
  }
}
