import { Global, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { GeneratorService } from '../../../common/generator/generator.service.js';
import * as bcrypt from 'bcrypt';
import { OtpType, UserType } from '../../../generated/prisma/enums.js';
import { VerifyOTPDto } from '../dto/verify-otp.dto.js';

@Global()
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
  ) {}

  async verifyOTP(data: VerifyOTPDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      const expired = await this.isExpired(
        user?.id || '',
        data.type,
        data.userType,
      );

      if (expired) {
        this.logger.warn(
          `OTP verification failed: No valid OTP found for email ${data.email}.`,
        );
        return {
          status: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.',
        };
      }

      if (!user) {
        this.logger.warn(
          `Email verification failed: User with email ${data.email} not found.`,
        );
        throw new NotFoundException('User not found');
      }

      const validated = await this.verifyToken(
        user.id,
        data.verificationCode,
        data.type,
        data.userType,
      );

      return {
        status: validated ? 'OTP_VERIFIED' : 'OTP_INVALID',
        message: validated
          ? 'OTP verified successfully.'
          : 'Invalid OTP. Please check the code and try again.',
      };
    } catch (error) {
      this.logger.error(error, 'Error verifying OTP', {
        email: data.email,
      });
      throw error;
    }
  }

  async createOTP(userId: string, type: OtpType, userType: UserType) {
    try {
      await this.prisma.otp.updateMany({
        where: {
          userId,
          type,
          userType,
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      });

      const token = await this.generator.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const codeHash = await bcrypt.hash(token, 10);

      await this.prisma.otp.create({
        data: { userId, codeHash, expiresAt, type, userType },
      });

      return token;
    } catch (error) {
      this.logger.error(`Failed to create OTP for user ${userId}`, error.stack);
      throw error;
    }
  }

  async isExpired(userId: string, type: OtpType, userType: UserType) {
    try {
      const otpRecord = await this.prisma.otp.findFirst({
        where: {
          userId,
          type,
          userType,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      return !otpRecord;
    } catch (error) {
      this.logger.error(
        `Failed to check OTP expiration for user ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  async verifyToken(
    userId: string,
    token: string,
    type: OtpType,
    userType: UserType,
  ) {
    try {
      const otpRecord = await this.prisma.otp.findFirst({
        where: {
          userId,
          type,
          userType,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) return false;

      const isValid = await bcrypt.compare(token, otpRecord.codeHash);

      if (!isValid) return false;

      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          used: true,
          expiresAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to verify OTP for user ${userId}`, error.stack);
      throw error;
    }
  }
}
