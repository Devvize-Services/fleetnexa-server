import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { VehicleDiscountDto } from '../dto/vehicle-dicount.dto.js';
import { VehicleRepository } from '../vehicle.repository.js';

@Injectable()
export class VehiclePricingService {
  private readonly logger = new Logger(VehiclePricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleRepo: VehicleRepository,
  ) {}

  async updateVehicleDiscounts(
    data: VehicleDiscountDto[],
    vehicleId: string,
    user: User,
  ) {
    try {
      if (!data || data.length === 0) {
        await this.prisma.vehicleDiscount.deleteMany({
          where: { vehicleId },
        });
        return;
      }

      await this.prisma.vehicleDiscount.deleteMany({
        where: {
          vehicleId,
          id: { notIn: data.map((d) => d.id) },
        },
      });

      await Promise.all(
        data.map((discount) =>
          this.prisma.vehicleDiscount.upsert({
            where: { id: discount.id },
            create: {
              id: discount.id,
              vehicleId: vehicleId,
              period: Number(discount.period),
              periodPolicy: discount.periodPolicy,
              amount: discount.amount,
              discountPolicy: discount.discountPolicy,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: user.username,
            },
            update: {
              amount: discount.amount,
              period: Number(discount.period),
              periodPolicy: discount.periodPolicy,
              discountPolicy: discount.discountPolicy,
              updatedAt: new Date(),
              updatedBy: user.username,
            },
          }),
        ),
      );

      const vehicle = await this.vehicleRepo.getVehicleById(
        vehicleId,
        user.tenantId,
      );

      return {
        message: 'Vehicle discounts updated successfully',
        vehicle,
      };
    } catch (error) {
      this.logger.error(
        error,
        `Failed to update vehicle discount for vehicle: ${vehicleId}`,
      );
      throw error;
    }
  }
}
