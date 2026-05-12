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
import { VehicleDamageService } from './vehicle-damage.service.js';
import type { AuthenticatedRequest } from 'src/types/authenticated-request.js';
import { VehicleDamageDto } from './vehicle-damage.dto.js';
import { LocalAuthGuard } from '../../../auth/guards/local.guard.js';

@Controller('vehicle/damage')
@UseGuards(LocalAuthGuard)
export class VehicleDamageController {
  constructor(private readonly service: VehicleDamageService) {}

  @Get(':id')
  async getVehicleDamages(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    return this.service.getVehicleDamages(id, tenant);
  }

  @Post()
  async addVehicleDamage(@Request() req, @Body() data: VehicleDamageDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.addVehicleDamage(data, tenant, user);
  }

  @Put()
  async updateVehicleDamage(@Request() req, @Body() data: VehicleDamageDto) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.updateVehicleDamage(data, tenant, user);
  }

  @Delete(':id')
  async deleteVehicleDamage(@Request() req, @Param('id') id: string) {
    const { tenant } = req.context;
    const user = req.user;
    return this.service.deleteVehicleDamage(id, tenant, user);
  }
}
