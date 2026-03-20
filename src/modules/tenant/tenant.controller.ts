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
  Request,
} from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { UpdateStorefrontDto } from './dto/update-storefront.dto.js';
import { ApiGuard } from '../../common/guards/api.guard.js';
import { LocalAuthGuard } from '../auth/guards/local.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from '../../common/enums/role.enum.js';
import { Roles } from '../auth/decorator/role.decorator.js';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  getCurrentTenant(@Request() req) {
    const { tenant } = req.user;
    return this.tenantService.getCurrentTenant(tenant, req.user);
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
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  getTodayActivities(@Request() req) {
    const tenant = req.user.tenant;
    return this.tenantService.getTodayActivities(tenant);
  }

  @Get('id/:id')
  getTenantById(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.TENANT_USER)
  createTenant(@Body() data: CreateTenantDto) {
    return this.tenantService.createTenant(data);
  }

  @Put()
  @UseGuards(LocalAuthGuard)
  updateTenant(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateTenantDto,
  ) {
    const tenant = req.context.tenant!;
    return this.tenantService.updateTenant(data, tenant);
  }

  @Patch('storefront')
  @UseGuards(LocalAuthGuard)
  updateStorefront(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateStorefrontDto,
  ) {
    const tenant = req.context.tenant!;
    return this.tenantService.updateStorefront(data, tenant);
  }
}
