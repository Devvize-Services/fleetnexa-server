import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TenantNotificationService } from './tenant-notification.service.js';
import type { AuthenticatedRequest } from '../../../types/authenticated-request.js';
import { LocalAuthGuard } from '../../auth/guards/local.guard.js';

@Controller('tenant/notification')
@UseGuards(LocalAuthGuard)
export class TenantNotificationController {
  constructor(private readonly service: TenantNotificationService) {}

  @Get()
  async getNotifications(@Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.getTenantNotifications(tenant, user);
  }

  @Post()
  async markAllAsRead(@Request() req) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.markAllNotificationsAsRead(tenant, user);
  }

  @Post(':id')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.markNotificationAsRead(id, tenant, user);
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    const { tenant } = req.user;
    const user = req.user;
    return this.service.deleteNotification(id, tenant, user);
  }
}
