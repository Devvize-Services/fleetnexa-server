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
import { TenantViolationService } from './tenant-violation.service.js';
import { TenantViolationDto } from './tenant-violation.dto.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';

@Controller('tenant/violation')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
export class TenantViolationController {
  constructor(private readonly service: TenantViolationService) {}

  @Get()
  async getTenantViolations(@Request() req) {
    const { tenant } = req.user;
    return this.service.getTenantViolations(tenant);
  }

  @Post()
  async createViolation(@Request() req, @Body() data: TenantViolationDto) {
    const { tenant } = req.user;
    return this.service.createViolation(data, tenant);
  }

  @Put()
  async updateViolation(@Request() req, @Body() data: TenantViolationDto) {
    const { tenant } = req.user;
    return this.service.updateViolation(data, tenant);
  }

  @Delete(':id')
  async deleteViolation(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    return this.service.deleteViolation(id, tenant);
  }
}
