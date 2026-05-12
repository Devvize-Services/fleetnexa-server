import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { VehicleRepository } from '../vehicle/vehicle.repository.js';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, VehicleRepository],
  exports: [AdminService],
})
export class AdminModule {}
