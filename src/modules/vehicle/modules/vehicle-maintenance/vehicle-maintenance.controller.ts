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
  Request,
} from '@nestjs/common';
import { VehicleMaintenanceService } from './vehicle-maintenance.service.js';
import { VehicleMaintenanceDto } from './vehicle-maintenance.dto.js';
import { JwtAuthGuard } from '../../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../../common/enums/role.enum.js';
import { Roles } from '../../../../modules/auth/decorator/role.decorator.js';

@Controller('vehicle/maintenance')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class VehicleMaintenanceController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Get()
  async getTenantMaintenanceServices(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantMaintenanceServices(tenant);
  }

  @Get('id/:id')
  async getVehicleMaintenances(@Param('id') id: string, @Request() req) {
    const { tenant } = req.user;
    return this.service.getVehicleMaintenances(id, tenant);
  }

  @Post()
  async addVehicleMaintenance(
    @Request() req,
    @Body() data: VehicleMaintenanceDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.addVehicleMaintenance(data, tenant, user);
  }

  @Post('complete')
  async completeVehicleMaintenance(
    @Request() req,
    @Body() data: VehicleMaintenanceDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.completeVehicleMaintenance(data, tenant, user);
  }

  @Put()
  async updateVehicleMaintenance(
    @Request() req,
    @Body() data: VehicleMaintenanceDto,
  ) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateVehicleMaintenance(data, tenant, user);
  }

  @Delete(':id')
  async deleteVehicleMaintenance(@Param('id') id: string, @Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteVehicleMaintenance(id, tenant, user);
  }
}
