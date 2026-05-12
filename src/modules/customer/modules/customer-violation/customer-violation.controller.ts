import {
  Body,
  Controller,
  UseGuards,
  Request,
  Post,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { Role } from '../../../../common/enums/role.enum.js';
import { Roles } from '../../../../modules/auth/decorator/role.decorator.js';
import { JwtAuthGuard } from '../../../../modules/auth/guards/jwt-auth.guard.js';
import { CustomerViolationService } from './customer-violation.service.js';
import { CustomerViolationDto } from './customer-violation.dto.js';

@Controller('customer/violation')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class CustomerViolationController {
  constructor(private readonly service: CustomerViolationService) {}

  @Get()
  async getAllCustomerViolations(@Request() req) {
    const { tenant } = req.user;
    return await this.service.getAllCustomerViolations(tenant);
  }

  @Get(':customerId')
  async getCustomerViolations(
    @Request() req,
    @Param('customerId') customerId: string,
  ) {
    const { tenant } = req.user;
    return await this.service.getCustomerViolations(tenant, customerId);
  }

  @Post()
  async createCustomerViolation(
    @Request() req,
    @Body() data: CustomerViolationDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;

    return await this.service.createCustomerViolation(data, tenant, user);
  }

  @Put()
  async updateCustomerViolation(
    @Request() req,
    @Body() data: CustomerViolationDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;

    return await this.service.updateCustomerViolation(data, tenant, user);
  }

  @Delete(':id')
  async deleteCustomerViolation(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;

    return await this.service.deleteCustomerViolation(id, tenant, user);
  }
}
