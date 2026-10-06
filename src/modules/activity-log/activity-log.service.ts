import { Global, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ActivityDto } from './activity-log.dto';
import { Tenant } from '../../generated/prisma/client';

@Global()
@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getActivities(tenant: Tenant) {
    return this.prisma.activity.findMany({
      where: {
        tenantId: tenant.id,
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        action: true,
        module: true,
        entityType: true,
        entityId: true,
        description: true,
        createdAt: true,
      },
    });
  }

  async logEvent(params: ActivityDto) {
    try {
      await this.prisma.activity.create({
        data: {
          userId: params.userId,
          tenantId: params.tenantId,
          action: params.action,
          module: params.module,
          entityType: params.entityType,
          entityId: params.entityId,
          description: params.description,
          oldValues: params.oldValues,
          newValues: params.newValues,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      return { message: 'Activity logged successfully' };
    } catch (error: any) {
      this.logger.error('Failed to write activity log', error);
      throw error;
    }
  }
}
