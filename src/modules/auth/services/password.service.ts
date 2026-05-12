import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserType } from '../../../generated/prisma/client.js';
import { UserRepository } from '../../../modules/user/user.repository.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  ResetPasswordDto,
  ResetPasswordRequestDto,
} from '../dto/reset-password.dto.js';
import { OtpService } from './otp.service.js';
import { AuditLogService } from './audit-log.service.js';
import { EmailService } from '../../../common/email/email.service.js';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepo: UserRepository,
    private readonly otpService: OtpService,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(data: ResetPasswordRequestDto, req: any) {
    try {
      const ip = req.ip;
      const userAgent = req.headers['user-agent'] || '';
      const meta = req.headers;

      const user = await this.userRepo.getAnyUserByEmail(
        data.email,
        data.userType,
      );

      if (!user) {
        this.logger.warn(
          `Password reset requested for non-existent email: ${data.email}`,
        );
        return null;
      }

      const token = await this.otpService.createOTP(
        user.id,
        'PASSWORD_RESET',
        data.userType,
      );

      await this.auditLogService.logEvent({
        userId: user.id,
        userType: data.userType,
        action: 'PASSWORD_RESET',
        ip,
        meta,
        userAgent,
      });

      await this.emailService.sendPasswordResetEmail(
        data.email,
        token,
        data.userType,
      );
    } catch (error) {
      this.logger.error(error, 'Error resetting tenant user password', {
        email: data.email,
      });
      throw error;
    }
  }

  async changePassword(data: ResetPasswordDto) {
    try {
      const user = await this.userRepo.getAnyUserByEmail(
        data.email,
        data.userType,
      );

      if (!user) {
        this.logger.warn(
          `Password change failed: User with email ${data.email} not found.`,
        );
        throw new NotFoundException('User not found');
      }

      const isSamePassword = await bcrypt.compare(data.password, user.password);

      if (isSamePassword) {
        this.logger.warn(
          `Password change failed: New password is the same as the old password for email ${data.email}.`,
        );
        return {
          status: 'SAME_PASSWORD',
          message: 'New password cannot be the same as the old password',
        };
      }

      const isReused = await this.checkPasswordHistory(
        user.id,
        data.password,
        data.userType,
      );

      if (isReused) {
        this.logger.warn(
          `Password change failed: New password has been used recently for email ${data.email}.`,
        );
        return {
          status: 'PASSWORD_REUSED',
          message: 'New password cannot be the same as the last 5 passwords',
        };
      }

      const hash = await bcrypt.hash(data.password, 10);

      if (data.userType === 'TENANT') {
        await this.prisma.user.update({
          where: { email: data.email },
          data: { password: hash },
        });
      } else if (data.userType === 'STOREFRONT') {
        await this.prisma.storefrontUser.update({
          where: { email: data.email },
          data: { password: hash },
        });
      } else if (data.userType === 'ADMIN') {
        await this.prisma.adminUser.update({
          where: { email: data.email },
          data: { password: hash },
        });
      }

      return {
        status: 'PASSWORD_CHANGED',
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(error, 'Error changing password', {
        email: data.email,
      });
      throw error;
    }
  }

  async checkPasswordHistory(
    userId: string,
    newPassword: string,
    userType: UserType,
  ) {
    try {
      const history = await this.prisma.passwordHistory.findMany({
        where: { userId, userType },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      for (const record of history) {
        const isMatch = await bcrypt.compare(newPassword, record.password);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error checking password history for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async addToPasswordHistory(
    userId: string,
    oldPassword: string,
    userType: UserType,
  ) {
    try {
      await this.prisma.passwordHistory.create({
        data: {
          userId,
          password: oldPassword,
          userType,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error adding password to history for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }
}
