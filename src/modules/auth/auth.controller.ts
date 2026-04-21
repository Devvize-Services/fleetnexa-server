import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Res,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalAuthGuard } from './guards/local.guard.js';
import type { Response } from 'express';
import { StorefrontAuthDto } from './dto/storefront-auth.dto.js';
import { RefreshAuthGuard } from './guards/refresh-auth.guard.js';
import { VerifyOTPDto } from './dto/verify-otp.dto.js';
import {
  ResetPasswordDto,
  ResetPasswordRequestDto,
} from './dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshToken(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Received refresh token request:', req.user);
    const result = await this.authService.refreshToken(req.user);

    const { accessToken } = result;

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post('tenant/login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user.id, 'TENANT');

    if (!result) {
      throw new Error('Login failed');
    }

    const { accessToken, refreshToken, user } = result;

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { user };
  }

  @UseGuards(LocalAuthGuard)
  @Post('admin/login')
  async adminLogin(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user.id, 'ADMIN');

    if (!result) {
      throw new Error('Login failed');
    }

    const { accessToken, refreshToken, user } = result;

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { user };
  }

  @UseGuards(LocalAuthGuard)
  @Post('storefront/login')
  async storefrontLogin(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(req.user.id, 'STOREFRONT');

    if (!result) {
      throw new Error('Login failed');
    }

    const { accessToken, refreshToken, user } = result;

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      domain: isProd ? '.rentnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      domain: isProd ? '.rentnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { user };
  }

  @Post('storefront/register')
  async createStorefrontUser(
    @Body() data: StorefrontAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.createStorefrontUser(data);

    if (!result) {
      throw new Error('Registration failed');
    }

    const { token, user } = result;

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      domain: isProd ? '.rentnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('access_token', {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @Post('password/forgot')
  async requestPasswordReset(
    @Request() req,
    @Body() data: ResetPasswordRequestDto,
  ) {
    return this.authService.forgotPassword(data, req);
  }

  @Post('password/reset')
  async resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.changePassword(data);
  }

  @Post('otp/verify')
  async verifyOTP(@Body() data: VerifyOTPDto) {
    return this.authService.verifyOTP(data);
  }
}
