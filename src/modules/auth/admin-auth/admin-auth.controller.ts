import { Body, Controller, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminAuthDto } from './admin-auth.dto.js';
import { EmailLoginDto, UsernameLoginDto } from '../dto/email-login.dto.js';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post('login')
  async loginAdmin(@Body() data: EmailLoginDto | UsernameLoginDto) {
    return this.service.login(data);
  }

  @Post('register')
  async registerAdmin(@Body() data: AdminAuthDto) {
    return this.service.createUser(data);
  }
}
