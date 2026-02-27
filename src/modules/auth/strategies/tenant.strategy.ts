import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service.js';

@Injectable()
export class TenantStrategy extends PassportStrategy(Strategy, 'tenant') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'username', passwordField: 'password' });
  }

  async validate(username: string, password: string) {
    console.log('Validating tenant user:', username);
    console.log(
      'Password provided:',
      password ? '***' : 'No password provided',
    );
    return this.authService.validateTenantUser(username, password);
  }
}
