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
} from '@nestjs/common';
import { TenantCustomerService } from './tenant-customer.service.js';
import type { AuthenticatedRequest } from '../../../types/authenticated-request.js';
import { TenantCustomerDto } from './tenant-customer.dto.js';
import { LocalAuthGuard } from '../../auth/guards/local.guard.js';

@Controller('tenant/customer')
@UseGuards(LocalAuthGuard)
export class TenantCustomerController {
  constructor(private readonly service: TenantCustomerService) {}

  @Get()
  async getCustomers(@Req() req: AuthenticatedRequest) {
    const { tenant } = req.context;
    return this.service.getCustomers(tenant);
  }

  @Get(':id')
  async getCustomerById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.service.getCustomerById(id, tenant);
  }

  @Post()
  async createCustomer(
    @Req() req: AuthenticatedRequest,
    @Body() data: TenantCustomerDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.createCustomer(data, tenant, user);
  }

  @Put()
  async updateCustomer(
    @Req() req: AuthenticatedRequest,
    @Body() data: TenantCustomerDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateCustomer(data, tenant, user);
  }

  @Delete(':id')
  async deleteCustomer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant, user } = req.context;
    return this.service.deleteCustomer(id, tenant, user);
  }
}
