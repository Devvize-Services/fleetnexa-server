import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpenseService } from './expense.service.js';
import { ExpenseDto } from './expense.dto.js';
import { LocalAuthGuard } from '../../../auth/guards/local.guard.js';

@Controller('transaction/expense')
@UseGuards(LocalAuthGuard)
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Get()
  async getExpenses(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantExpenses(tenant);
  }

  @Post()
  async createExpense(@Request() req, @Body() data: ExpenseDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.createExpense(data, tenant, user);
  }

  @Put()
  async updateExpense(@Request() req, @Body() data: ExpenseDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateExpense(data, tenant, user);
  }

  @Delete(':id')
  async deleteExpense(@Request() req, @Param('id') expenseId: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteExpense(expenseId, tenant, user);
  }
}
