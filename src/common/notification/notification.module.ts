import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { UserRepository } from '../../modules/user/user.repository.js';

@Global()
@Module({
  providers: [NotificationService, UserRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
