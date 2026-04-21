import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UserType } from '../../../generated/prisma/enums.js';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSession(params: { userId: string; userType: UserType }) {
    try {
      return this.prisma.session.create({
        data: {
          userId: params.userId,
          userType: params.userType,
          tokenHash: '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create session for userId: ${params.userId}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateSessionToken(sessionId: string, refreshToken: string) {
    try {
      const tokenHash = await bcrypt.hash(refreshToken, 10);
      return this.prisma.session.update({
        where: { id: sessionId },
        data: { tokenHash },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update session token for sessionId: ${sessionId}`,
        error.stack,
      );
      throw error;
    }
  }

  async validateSession(params: { userId: string; refreshToken: string }) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId: params.userId,
        },
      });

      for (const session of sessions) {
        const isValid = await bcrypt.compare(
          params.refreshToken,
          session.tokenHash,
        );

        if (isValid && session.expiresAt > new Date()) {
          return session;
        }
      }

      this.logger.warn(`Invalid session attempt for userId: ${params.userId}`);
      throw new UnauthorizedException('Session is invalid or has expired');
    } catch (error) {
      this.logger.error(
        `Failed to validate session for userId: ${params.userId}`,
        error.stack,
      );
      throw error;
    }
  }

  async revokeSession(sessionId: string) {
    try {
      return this.prisma.session.delete({
        where: { id: sessionId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to revoke session with id: ${sessionId}`,
        error.stack,
      );
      throw error;
    }
  }

  async revokeAllUserSessions(userId: string) {
    try {
      return this.prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to revoke all sessions for userId: ${userId}`,
        error.stack,
      );
      throw error;
    }
  }
}
