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
  Request,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service.js';
import { ApiGuard } from '../../common/guards/api.guard.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { VehicleStatusDto } from './dto/vehicle-status.dto.js';
import { VehicleDto } from './dto/vehicle.dto.js';
import { VehicleLocationDto } from './dto/vehicle-location.dto.js';
import { SwapVehicleDto } from './dto/swap-vehicle.dto.js';
import { LocalAuthGuard } from '../auth/guards/local.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
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
  @Roles(Role.TENANT_USER)
  async getVehicleByLicensePlate(
    @Param('plate') licensePlate: string,
    @Request() req,
  ) {
    const { tenant } = req.user;
    return this.service.getVehicleByLicensePlate(licensePlate, tenant);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async getVehicleById(@Param('id') id: string, @Request() req) {
    console.log(
      'This is being hit instead of maintenance endpoint, vehicle id:',
      id,
    );
    const { tenant } = req.user;
    return this.service.getVehicleById(id, tenant);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async createVehicle(@Request() req, @Body() data: VehicleDto) {
    const user = req.user;
    const { tenant } = req.user;
    return this.service.addVehicle(data, tenant, user);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  async updateVehicle(@Request() req, @Body() data: VehicleDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateVehicle(data, tenant, user);
  }

  @Patch('status')
  @UseGuards(LocalAuthGuard)
  async updateVehicleStatus(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleStatusDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateVehicleStatus(data, tenant, user);
  }

  @Patch('location')
  @UseGuards(LocalAuthGuard)
  async updateVehicleLocation(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleLocationDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateVehicleLocation(data, tenant, user);
  }

  @Post('swap')
  @UseGuards(LocalAuthGuard)
  async swapVehicle(
    @Req() req: AuthenticatedRequest,
    @Body() data: SwapVehicleDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.swapBookingVehicle(data, tenant, user);
  }

  @Delete(':id')
  @UseGuards(LocalAuthGuard)
  async deleteVehicle(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant, user } = req.context;
    return this.service.deleteVehicle(id, tenant, user);
  }

  @Patch(':id/storefront')
  @UseGuards(LocalAuthGuard)
  async updateVehicleStorefrontStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') vehicleId: string,
  ) {
    const { tenant, user } = req.context;

    return this.service.updateVehicleStorefrontStatus(vehicleId, tenant, user);
  }
}
