import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VehicleRepository } from '../vehicle.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ActivityService } from '../../../common/activity/activity.service';
import { Tenant, User } from '../../../generated/prisma/browser';
import { VehicleOdometerDto } from '../vehicle.dto';

@Injectable()
export class VehicleOdometerService {
  private readonly logger = new Logger(VehicleOdometerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleRepo: VehicleRepository,
    private readonly activity: ActivityService,
  ) {}

  async updateVehicleOdometer(
    data: VehicleOdometerDto,
    tenant: Tenant,
    user: User,
    req?: any,
  ) {
    try {
      const existing = await this.vehicleRepo.getVehicleById(
        data.vehicleId,
        tenant.id,
      );

      if (!existing) {
        this.logger.error(`Vehicle with ID ${data.vehicleId} not found`);
        throw new NotFoundException(`Vehicle not found`);
      }

      if (data.odometer < existing.odometer) {
        this.logger.error(
          `New odometer reading ${data.odometer} is less than existing reading ${existing.odometer}`,
        );
        throw new ConflictException(
          `New odometer reading cannot be less than existing reading`,
        );
      }

      await this.prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { odometer: data.odometer },
      });

      await this.activity.logEvent({
        userId: user.id,
        tenantId: tenant.id,
        action: 'UPDATE',
        module: 'VEHICLE',
        entityType: 'VEHICLE',
        entityId: data.vehicleId,
        description: `Updated odometer reading to ${data.odometer}`,
        oldValues: { odometer: existing.odometer },
        newValues: { odometer: data.odometer },
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      });

      return {
        message: 'Odometer updated successfully',
        vehicle: await this.vehicleRepo.getVehicleById(data.vehicleId),
        vehicles: await this.vehicleRepo.getVehicles(tenant.id),
      };
    } catch (error) {
      this.logger.error(
        `Failed to update odometer for vehicle ID ${data.vehicleId}`,
        error,
      );
      throw error;
    }
  }
}
