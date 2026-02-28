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
import { VehicleMaintenanceService } from './vehicle-maintenance.service.js';
import type { AuthenticatedRequest } from '../../../../types/authenticated-request.js';
import { VehicleMaintenanceDto } from './vehicle-maintenance.dto.js';
import { LocalAuthGuard } from '../../../auth/guards/local.guard.js';

@Controller('vehicle/maintenance')
@UseGuards(LocalAuthGuard)
export class VehicleMaintenanceController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Get()
  async getTenantMaintenanceServices(@Req() req: AuthenticatedRequest) {
    const { tenant } = req.context;
    return this.service.getTenantMaintenanceServices(tenant);
  }

  @Get(':id')
  async getVehicleMaintenances(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant } = req.context;
    return this.service.getVehicleMaintenances(id, tenant);
  }

  @Post()
  async addVehicleMaintenance(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleMaintenanceDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.addVehicleMaintenance(data, tenant, user);
  }

  @Post('complete')
  async completeVehicleMaintenance(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleMaintenanceDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.completeVehicleMaintenance(data, tenant, user);
  }

  @Put()
  async updateVehicleMaintenance(
    @Req() req: AuthenticatedRequest,
    @Body() data: VehicleMaintenanceDto,
  ) {
    const { tenant, user } = req.context;
    return this.service.updateVehicleMaintenance(data, tenant, user);
  }

  @Delete(':id')
  async deleteVehicleMaintenance(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { tenant, user } = req.context;
    return this.service.deleteVehicleMaintenance(id, tenant, user);
  }
}
