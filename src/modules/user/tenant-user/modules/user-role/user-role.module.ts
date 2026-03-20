import { Module } from '@nestjs/common';
import { UserModule } from '../../../user.module.js';
import { UserRoleService } from './user-role.service.js';
import { UserRoleController } from './user-role.controller.js';
import { TenantRepository } from '../../../../../modules/tenant/tenant.repository.js';
import { UserRepository } from '../../../../../modules/user/user.repository.js';

@Module({
  imports: [UserModule],
  controllers: [UserRoleController],
  providers: [UserRoleService, TenantRepository, UserRepository],
  exports: [UserRoleService],
})
export class UserRoleModule {}
