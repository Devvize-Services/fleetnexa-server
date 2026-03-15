import { Body, Controller, Get, Put, UseGuards, Request } from '@nestjs/common';
import { TenantRatesService } from './tenant-rates.service.js';
import { TenantRateDto } from './tenant-rate.dto.js';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Roles } from '../../../modules/auth/decorator/role.decorator.js';

@Controller('tenant/rate')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT_USER)
export class TenantRatesController {
  constructor(private readonly service: TenantRatesService) {}

  @Get()
  async getTenantRates(@Request() req) {
    const tenant = req.user.tenant;
    return this.service.getTenantRates(tenant);
  }

  @Put()
  async updateTenantRate(@Request() req, @Body() data: TenantRateDto) {
    const tenant = req.user.tenant;
    return this.service.updateTenantRate(data, tenant);
  }
}
