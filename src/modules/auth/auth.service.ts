import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user/user.repository.js';
import { StorefrontAuthDto } from './dto/storefront-auth.dto.js';
import { SessionService } from './services/session.service.js';
import { AuditLogService } from './services/audit-log.service.js';
import { VerifyOTPDto } from './dto/verify-otp.dto.js';
import { OtpService } from './services/otp.service.js';
import {
  ResetPasswordDto,
  ResetPasswordRequestDto,
} from './dto/reset-password.dto.js';
import { PasswordService } from './services/password.service.js';
import { UserType } from 'src/generated/prisma/enums.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
    private readonly sessionService: SessionService,
    private readonly auditLogService: AuditLogService,
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordService,
  ) {}

  async validateUser(
    username: string,
    password: string,
    type: UserType,
    ip: string,
    userAgent: string,
  ) {
    try {
      const user = await this.userRepo.getAnyUserByUsername(username, type);

      if (!user) {
        this.logger.warn(`Login failed: User ${username} not found.`);
        throw new UnauthorizedException('Invalid username or password');
      }

      if (!user.password) {
        this.logger.warn(
          `Login failed: User ${username} does not have a password set.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      if (!user.password) {
        this.logger.warn(
          `Login failed: ${type} user ${username} does not have a password set.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        this.auditLogService.logEvent({
          userId: user.id,
          userType: type,
          action: 'LOGIN_FAILED',
          ip,
          userAgent,
        });

        this.logger.warn(
          `Login failed: Invalid password for ${type} user ${username}.`,
        );
        throw new UnauthorizedException('Invalid username or password');
      }

      return {
        id: user.id,
        email: user.email,
        role: type,
        username: 'username' in user ? user.username : null,
        tenantId: 'tenantId' in user ? user.tenantId : null,
      };
    } catch (error) {
      this.logger.error(`Error validating user ${username}: ${error.message}`);
      throw error;
    }
  }

  async login(userId: string, userType: UserType) {
    try {
      const user = await this.userRepo.getAnyUserById(userId, userType);

      if (!user) throw new UnauthorizedException('User not found');

      const session = await this.sessionService.createLoginSession({
        userId: user.id,
        userType,
        role: userType,
        tenantId: 'tenantId' in user ? user.tenantId : '',
      });

      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user,
        role: userType,
        tenantId: 'tenantId' in user ? user.tenantId : '',
      };
    } catch (error) {
      this.logger.error(
        `Error logging in user with ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async refreshToken(payload: any) {
    try {
      const sessionId = payload.sessionId;

      const session = await this.sessionService.getBySessionId(sessionId);

      if (!session) {
        this.logger.warn(
          `Refresh token failed: Session with ID ${sessionId} not found.`,
        );
        throw new UnauthorizedException('Invalid session');
      }

      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        role: payload.role,
        sessionId: session.id,
        tenantId: payload.tenantId,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error(`Error refreshing token: ${error.message}`);
      throw error;
    }
  }

  async forgotPassword(data: ResetPasswordRequestDto, req: any) {
    return this.passwordService.forgotPassword(data, req);
  }

  async changePassword(data: ResetPasswordDto) {
    return this.passwordService.changePassword(data);
  }

  async verifyOTP(data: VerifyOTPDto) {
    return this.otpService.verifyOTP(data);
  }

  async createStorefrontUser(data: StorefrontAuthDto) {
    try {
      const [existingEmail, existingLicense] = await Promise.all([
        this.prisma.storefrontUser.findUnique({ where: { email: data.email } }),
        this.prisma.storefrontUser.findFirst({
          where: { driverLicenseNumber: data.licenseNumber },
        }),
      ]);

      if (existingEmail || existingLicense) {
        this.logger.warn('Registration conflict', {
          emailConflict: !!existingEmail,
          licenseConflict: !!existingLicense,
        });
        throw new ConflictException(
          'An account with these details already exists.',
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const user = await this.userRepo.createStorefrontUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: data.gender || 'male',
        phone: data.phone || '',
        password: hashedPassword,
        driverLicenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        licenseIssued: new Date(data.licenseIssued),
        license: data.license,
        dateOfBirth: data.dateOfBirth,
        street: data.street || '',
        countryId: data.countryId || null,
        stateId: data.stateId || null,
      });

      const payload = {
        sub: user.id,
        role: 'STOREFRONT',
      };

      const token = this.jwtService.sign(payload);

      return { token, user, role: 'STOREFRONT' };
    } catch (error) {
      this.logger.error('Error creating user', { error });
      throw error;
    }
  }
}
