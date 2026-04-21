import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { UserRoleModule } from './modules/user-role/user-role.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [UserRoleModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
