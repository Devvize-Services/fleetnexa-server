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
import { JwtAuthGuard } from '../../../../modules/auth/guards/jwt-auth.guard.js';
import { Roles } from '../../../../modules/auth/decorator/role.decorator.js';
import { Role } from '../../../../common/enums/role.enum.js';

@Controller('transaction/expense')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
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
