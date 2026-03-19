import { forwardRef, Module } from '@nestjs/common';
import { ExpenseModule } from '../../../../modules/transaction/modules/expense/expense.module.js';
import { VehicleMaintenanceController } from './vehicle-maintenance.controller.js';
import { VehicleMaintenanceService } from './vehicle-maintenance.service.js';
import { TenantRepository } from '../../../../modules/tenant/tenant.repository.js';
import { TenantUserRepository } from '../../../../modules/user/tenant-user/tenant-user.repository.js';
import { VehicleModule } from '../../vehicle.module.js';
import { VehicleRepository } from '../../vehicle.repository.js';

@Module({
  imports: [ExpenseModule, forwardRef(() => VehicleModule)],
  controllers: [VehicleMaintenanceController],
  providers: [
    VehicleMaintenanceService,
    TenantRepository,
    TenantUserRepository,
    VehicleRepository,
  ],
  exports: [VehicleMaintenanceService],
})
export class VehicleMaintenanceModule {}
