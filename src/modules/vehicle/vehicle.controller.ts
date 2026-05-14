import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service.js';
import { ApiGuard } from '../auth/guards/api.guard.js';
import { VehicleStatusDto } from './dto/vehicle-status.dto.js';
import { VehicleDto } from './dto/vehicle.dto.js';
import { VehicleLocationDto } from './dto/vehicle-location.dto.js';
import { SwapVehicleDto } from './dto/swap-vehicle.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';
import { VehicleDiscountDto } from './dto/vehicle-dicount.dto.js';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getTenantVehicles(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantVehicles(tenant);
  }

  @Get('storefront')
  @UseGuards(ApiGuard)
  async getStorefrontVehicles() {
    return this.service.getStorefrontVehicles();
  }

  @Get('storefront/:id')
  @UseGuards(ApiGuard)
  async getVehicleForStorefrontById(@Param('id') id: string) {
    return this.service.getVehicleForStorefrontById(id);
  }

  @Get('storefront/tenant/:tenantId')
  @UseGuards(ApiGuard)
  async getTenantStorefrontVehicles(@Param('tenantId') tenantId: string) {
    return this.service.getTenantStorefrontVehicles(tenantId);
  }

  @Get('plate/:plate')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getVehicleByLicensePlate(
    @Param('plate') licensePlate: string,
    @Request() req,
  ) {
    const { tenant } = req.user;
    return this.service.getVehicleByLicensePlate(licensePlate, tenant);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async getVehicleById(@Param('id') id: string, @Request() req) {
    const { tenant } = req.user;
    return this.service.getVehicleById(id, tenant);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async createVehicle(@Request() req, @Body() data: VehicleDto) {
    const user = req.user;
    const { tenant } = req.user;
    return this.service.addVehicle(data, tenant, user);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateVehicle(@Request() req, @Body() data: VehicleDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateVehicle(data, tenant, user);
  }

  @Patch('status')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateVehicleStatus(@Request() req, @Body() data: VehicleStatusDto) {
    const { tenant } = req.user;
    const user = req.user;

    return this.service.updateVehicleStatus(data, tenant, user);
  }

  @Patch('location')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateVehicleLocation(
    @Request() req,
    @Body() data: VehicleLocationDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;

    return this.service.updateVehicleLocation(data, tenant, user);
  }

  @Post('swap')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async swapVehicle(@Request() req, @Body() data: SwapVehicleDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.swapBookingVehicle(data, tenant, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async deleteVehicle(@Param('id') id: string, @Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteVehicle(id, tenant, user);
  }

  @Patch(':id/storefront')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateVehicleStorefrontStatus(
    @Request() req,
    @Param('id') vehicleId: string,
  ) {
    const { tenant } = req.user;
    const user = req.user;

    return this.service.updateVehicleStorefrontStatus(vehicleId, tenant, user);
  }

  @Post('discounts/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT)
  async updateVehicleDiscounts(
    @Request() req,
    @Param('id') vehicleId: string,
    @Body() data: VehicleDiscountDto[],
  ) {
    const user = req.user;

    return await this.service.updateVehicleDiscounts(data, vehicleId, user);
  }
}
