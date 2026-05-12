import { Injectable, Logger } from '@nestjs/common';
import { VehicleDiscountDto } from '../dto/vehicle.dto.js';
import { TxClient } from '../../../prisma/prisma.service.js';
import { User } from '../../../generated/prisma/client.js';

@Injectable()
export class VehiclePricingService {
  private readonly logger = new Logger(VehiclePricingService.name);

  constructor() {}

  async upsertVehicleDiscount(
    tx: TxClient,
    vehicleId: string,
    discounts: VehicleDiscountDto[],
    user: User,
  ) {
    try {
      if (!discounts || discounts.length === 0) {
        await tx.vehicleDiscount.deleteMany({
          where: { vehicleId },
        });
        return;
      }

      await tx.vehicleDiscount.deleteMany({
        where: {
          vehicleId,
          id: { notIn: discounts.map((d) => d.id) },
        },
      });

      await Promise.all(
        discounts.map((discount) =>
          tx.vehicleDiscount.upsert({
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
    } catch (error) {
      this.logger.error(
        error,
        `Failed to upsert vehicle discount for vehicle: ${vehicleId}`,
      );
      throw error;
    }
  }
}
