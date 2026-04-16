/** biome-ignore-all lint/style/useImportType: <> */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiGuard } from '../auth/guards/api.guard.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get()
  async getAdminData() {
    return this.service.getClientData();
  }

  @Get('storefront')
  @UseGuards(ApiGuard)
  async getStorefrontData() {
    return this.service.getStorefrontData();
  }

  @Get('dashboard')
  async getDashboardAdminData() {
    return this.service.getDashboardAdminData();
  }
}
