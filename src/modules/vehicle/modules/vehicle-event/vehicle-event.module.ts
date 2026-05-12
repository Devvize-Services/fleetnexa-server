import { forwardRef, Module } from '@nestjs/common';
import { VehicleEventService } from './vehicle-event.service.js';
import { VehicleModule } from '../../vehicle.module.js';

@Module({
  imports: [forwardRef(() => VehicleModule)],
  controllers: [],
  providers: [VehicleEventService],
  exports: [VehicleEventService],
})
export class VehicleEventModule {}
