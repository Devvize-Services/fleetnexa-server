import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Param,
  Put,
  Patch,
} from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { UpdateStorefrontDto } from './dto/update-storefront.dto.js';
import { ApiGuard } from '../../common/guards/api.guard.js';
import { TenantAuthGuard } from '../auth/guards/tenant-auth.guard.js';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @UseGuards(TenantAuthGuard)
  getCurrentTenant(@Req() req: AuthenticatedRequest) {
    const { tenant, user } = req.context;
    return this.tenantService.getCurrentTenant(tenant, user);
  }

  @Get('storefront')
  @UseGuards(ApiGuard)
  getStorefrontTenants() {
    return this.tenantService.getStorefrontTenants();
  }

  @Get('storefront/:slug')
  @UseGuards(ApiGuard)
  getStorefrontTenantBySlug(@Param('slug') slug: string) {
    return this.tenantService.getStorefrontTenantBySlug(slug);
  }

  @Get('storefront/domain/:domain')
  @UseGuards(ApiGuard)
  getStorefrontTenantByDomain(@Param('domain') domain: string) {
    return this.tenantService.getStorefrontTenantByDomain(domain);
  }

  @Get('today')
  @UseGuards(TenantAuthGuard)
  getTodayActivities(@Req() req: AuthenticatedRequest) {
    const tenant = req.context.tenant!;
    return this.tenantService.getTodayActivities(tenant);
  }

  @Get(':id')
  getTenantById(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  @Post()
  createTenant(@Body() data: CreateTenantDto) {
    return this.tenantService.createTenant(data);
  }

  @Put()
  @UseGuards(TenantAuthGuard)
  updateTenant(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateTenantDto,
  ) {
    const tenant = req.context.tenant!;
    return this.tenantService.updateTenant(data, tenant);
  }

  @Patch('storefront')
  @UseGuards(TenantAuthGuard)
  updateStorefront(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateStorefrontDto,
  ) {
    const tenant = req.context.tenant!;
    return this.tenantService.updateStorefront(data, tenant);
  }
}
