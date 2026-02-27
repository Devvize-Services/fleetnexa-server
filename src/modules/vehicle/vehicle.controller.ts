import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service.js';
import { ApiGuard } from '../../common/guards/api.guard.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { VehicleStatusDto } from './dto/vehicle-status.dto.js';
import { VehicleDto } from './dto/vehicle.dto.js';
import { VehicleLocationDto } from './dto/vehicle-location.dto.js';
import { SwapVehicleDto } from './dto/swap-vehicle.dto.js';
import { TenantAuthGuard } from '../auth/guards/tenant-auth.guard.js';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  @Get()
  @UseGuards(TenantAuthGuard)
  async getTenantVehicles(@Req() req: AuthenticatedRequest) {
    const { tenant } = req.context;
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
  @UseGuards(TenantAuthGuard)
  async getVehicleByLicensePlate(
    @Param('plate') licensePlate: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.service.getVehicleByLicensePlate(licensePlate, tenant);
  }

  @Get(':id')
  @UseGuards(TenantAuthGuard)
  async getVehicleById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.service.getVehicleById(id, tenant);
  }

  @Post()
  @UseGuards(TenantAuthGuard)
  async createVehicle(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.addVehicle(data, tenant, user);
  }

  @Put()
  @UseGuards(TenantAuthGuard)
  async updateVehicle(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateVehicle(data, tenant, user);
  }

  @Patch('status')
  @UseGuards(TenantAuthGuard)
  async updateVehicleStatus(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleStatusDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateVehicleStatus(data, tenant, user);
  }

  @Patch('location')
  @UseGuards(TenantAuthGuard)
  async updateVehicleLocation(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleLocationDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateVehicleLocation(data, tenant, user);
  }

  @Post('swap')
  @UseGuards(TenantAuthGuard)
  async swapVehicle(
    @Req() req: AuthenticatedRequest,
    @Body() data: SwapVehicleDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.swapBookingVehicle(data, tenant, user);
  }

  @Delete(':id')
  @UseGuards(TenantAuthGuard)
  async deleteVehicle(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant, user } = req.context;
    return this.service.deleteVehicle(id, tenant, user);
  }

  @Patch(':id/storefront')
  @UseGuards(TenantAuthGuard)
  async updateVehicleStorefrontStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') vehicleId: string,
  ) {
    const { tenant, user } = req.context;

    return this.service.updateVehicleStorefrontStatus(vehicleId, tenant, user);
  }
}
