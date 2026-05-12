import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { TenantCustomerDto } from './dto/tenant-customer.dto.js';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getCustomers(@Request() req) {
    const { tenant } = req.user;
    return this.customerService.getCustomers(tenant);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getCustomerById(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async createCustomer(@Request() req, @Body() data: TenantCustomerDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.customerService.createCustomer(data, tenant, user);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateCustomer(@Request() req, @Body() data: TenantCustomerDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.customerService.updateCustomer(data, tenant, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async deleteCustomer(@Param('id') id: string, @Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.customerService.deleteCustomer(id, tenant, user);
  }

  // @Post('violation')
  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.TENANT)
  // async createCustomerViolation(
  //   @Request() req,
  //   @Body() data: CustomerViolationDto,
  // ) {
  //   const { tenant } = req.user;
  //   const user = req.user;

  //   return await this.customerService.createCustomerViolation(
  //     data,
  //     tenant,
  //     user,
  //   );
  // }

  // @Put('violation')
  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.TENANT)
  // async updateCustomerViolation(
  //   @Request() req,
  //   @Body() data: CustomerViolationDto,
  // ) {
  //   const { tenant } = req.user;
  //   const user = req.user;
  //   return await this.customerService.updateCustomerViolation(
  //     data,
  //     tenant,
  //     user,
  //   );
  // }

  // @Delete('violation/:id')
  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.TENANT)
  // async deleteCustomerViolation(@Param('id') id: string, @Request() req) {
  //   const { tenant } = req.user;
  //   const user = req.user;
  //   return await this.customerService.deleteCustomerViolation(id, tenant, user);
  // }
}
