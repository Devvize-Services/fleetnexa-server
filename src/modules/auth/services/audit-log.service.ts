import { Injectable, Logger } from '@nestjs/common';
import { AuthAction, UserType } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: {
    userId: string;
    userType: UserType;
    action: AuthAction;
    meta?: any;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          userType: params.userType,
          action: params.action,
          metaData: params.meta ? JSON.stringify(params.meta) : '{}',
          ipAddress: params.ip || '',
          userAgent: params.userAgent || '',
        },
      });
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
      throw error;
    }
  }
}
