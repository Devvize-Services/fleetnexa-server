import { Controller, Get, Post, UseGuards, Request, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalAuthGuard } from './guards/local.guard.js';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('tenant/login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.loginTenantUser(req.user.id);

    if (!result) {
      throw new Error('Login failed');
    }

    const { token, user } = result;

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      domain: isProd ? '.fleetnexa.com' : undefined,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { user, token };
  }
}
