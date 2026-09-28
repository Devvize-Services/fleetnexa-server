import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../../shared/enums/role.enum';
import { Roles } from '../auth/decorator/role.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
@Roles(Role.TENANT)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getDashboardStats(@Request() req) {
    const { tenant } = req.user;
    return this.reportsService.getDashboardStats(tenant);
  }
}
