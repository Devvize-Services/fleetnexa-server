import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';

@Controller('transaction')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get()
  getTransactions(@Request() req) {
    const tenant = req.user.tenant;
    return this.service.getTransactions(tenant);
  }
}
