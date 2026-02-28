import { Body, Controller, Get, Put, UseGuards, Request } from '@nestjs/common';
import { TenantRatesService } from './tenant-rates.service.js';
import { TenantRateDto } from './tenant-rate.dto.js';
import { LocalAuthGuard } from '../../auth/guards/local.guard.js';

@Controller('tenant/rate')
@UseGuards(LocalAuthGuard)
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
