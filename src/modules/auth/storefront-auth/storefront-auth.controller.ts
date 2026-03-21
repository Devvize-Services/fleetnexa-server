import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { StorefrontAuthService } from './storefront-auth.service.js';
import { StorefrontAuthDto } from './storefront-auth.dto.js';
import { EmailLoginDto } from '../dto/email-login.dto.js';
import { ApiGuard } from '../../../common/guards/api.guard.js';
import { VerifyEmailTokenDto } from '../dto/verify-email-token.dto.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';

@Controller('auth/storefront')
@UseGuards(ApiGuard)
export class StorefrontAuthController {
  constructor(private readonly service: StorefrontAuthService) {}

  @Post('login')
  async login(@Body() data: EmailLoginDto) {
    return this.service.loginUser(data);
  }

  @Post('register')
  async register(@Body() data: StorefrontAuthDto) {
    return this.service.createUser(data);
  }

  @Post('forgot-password')
  async requestPasswordReset(@Body() data: any) {
    const { email } = data;
    return this.service.requestPasswordReset(email);
  }

  @Post('verify-token')
  async verifyResetToken(@Body() data: VerifyEmailTokenDto) {
    return this.service.validatePasswordResetToken(data);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto) {
    return this.service.resetPassword(data);
  }
}
