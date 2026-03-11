import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { TenantUserRepository } from './tenant-user/tenant-user.repository.js';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, TenantUserRepository],
  exports: [UserService],
})
export class UserModule {}
