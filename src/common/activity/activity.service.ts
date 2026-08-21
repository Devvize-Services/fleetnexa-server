import { Global, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ActivityDto } from './activity.dto';

@Global()
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

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
