import { Module } from '@nestjs/common';
import { AwsModule } from '../../common/aws/aws.module.js';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';
import { ApiGuard } from '../auth/guards/api.guard.js';

@Module({
  imports: [AwsModule],
  controllers: [StorageController],
  providers: [StorageService, ApiGuard],
  exports: [StorageService],
})
export class StorageModule {}
