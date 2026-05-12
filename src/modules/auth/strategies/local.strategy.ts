import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, username: string, password: string) {
    const role = req.body?.role;

    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('user-agent');
    if (!role) {
      throw new Error('Role is required');
    }

    return this.authService.validateUser(
      username,
      password,
      role,
      ip,
      userAgent,
    );
  }
}
