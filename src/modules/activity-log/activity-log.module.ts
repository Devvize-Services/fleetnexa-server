import { Global, Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';

@Global()
@Module({
  providers: [ActivityLogService],
  exports: [ActivityLogService],
  controllers: [ActivityLogController],
})
export class ActivityLogModule {}
