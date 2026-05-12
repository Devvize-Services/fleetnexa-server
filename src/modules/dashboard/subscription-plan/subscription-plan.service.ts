import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  SubscriptionPlanDto,
  SubscriptionPlanFeatureDto,
} from './subscription-plan.dto.js';
import { PlanFeatures } from 'src/generated/prisma/client.js';

@Injectable()
export class SubscriptionPlanService {
  private readonly logger = new Logger(SubscriptionPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllPlans() {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        include: {
          features: true,
          categories: true,
          details: true,
        },
      });

      return plans;
    } catch (error) {
      this.logger.error('Failed to retrieve plans', error);
      throw error;
    }
  }

  async createPlan(data: SubscriptionPlanDto) {
    try {
      const existingPlanId = await this.prisma.subscriptionPlan.findUnique({
        where: { planId: data.planId },
      });

      if (existingPlanId) {
        this.logger.warn(`Plan with planId ${data.planId} already exists.`);
        throw new Error('Subscription plan with this planId already exists.');
      }

      const existingPlanCode = await this.prisma.subscriptionPlan.findUnique({
        where: { planCode: data.planCode },
      });

      if (existingPlanCode) {
        this.logger.warn(`Plan with planCode ${data.planCode} already exists.`);
        throw new Error('Subscription plan with this planCode already exists.');
      }

      await this.prisma.subscriptionPlan.create({
        data: {
          name: data.name,
          planId: data.planId,
          planCode: data.planCode,
          price: data.price,
          description: data.description,
          categories: {
            connect: data.categories.map((category) => ({ id: category.id })),
          },
          features: {
            create: data.features.map((feature) => ({
              feature: feature.feature,
            })),
          },
          details: {
            create: {
              users: data.users,
              vehicles: data.vehicles,
            },
          },
        },
      });

      await this.handleFeatures(data.id, [], data.features);

      const plans = await this.getAllPlans();
      return { message: 'Subscription plan created successfully.', plans };
    } catch (error) {
      this.logger.error('Failed to create subscription plan', error);
      throw error;
    }
  }

  async updatePlan(data: SubscriptionPlanDto) {
    try {
      const existingPlan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: data.id },
        include: { features: true, categories: true, details: true },
      });

      if (!existingPlan) {
        this.logger.warn(`Plan with id ${data.id} does not exist.`);
        throw new NotFoundException();
      }

      if (existingPlan.planId !== data.planId) {
        const existingPlanId = await this.prisma.subscriptionPlan.findUnique({
          where: { planId: data.planId },
        });

        if (existingPlanId) {
          this.logger.warn(`Plan with planId ${data.planId} already exists.`);
          throw new ConflictException(
            'Subscription plan with this planId already exists.',
          );
        }
      }

      if (existingPlan.planCode !== data.planCode) {
        const existingPlanCode = await this.prisma.subscriptionPlan.findUnique({
          where: { planCode: data.planCode },
        });

        if (existingPlanCode) {
          this.logger.warn(
            `Plan with planCode ${data.planCode} already exists.`,
          );
          throw new ConflictException(
            'Subscription plan with this planCode already exists.',
          );
        }
      }

      await this.prisma.subscriptionPlan.update({
        where: { id: data.id },
        data: {
          name: data.name,
          planId: data.planId,
          planCode: data.planCode,
          price: data.price,
          description: data.description,
          details: {
            update: {
              users: data.users,
              vehicles: data.vehicles,
            },
          },
          categories: {
            set: data.categories.map((category) => ({ id: category.id })),
          },
        },
      });

      await this.handleFeatures(data.id, existingPlan.features, data.features);

      const plans = await this.getAllPlans();
      return { message: 'Subscription plan updated successfully.', plans };
    } catch (error) {
      this.logger.error('Failed to update subscription plan', error);
      throw error;
    }
  }

  async handleFeatures(
    planId: string,
    existingFeatures: PlanFeatures[],
    incomingFeatures: SubscriptionPlanFeatureDto[],
  ) {
    const incomingIds = incomingFeatures.filter((f) => f.id).map((f) => f.id);

    const existingIds = existingFeatures.map((f) => f.id);

    const featuresToDelete = existingIds.filter(
      (id) => !incomingIds.includes(id),
    );

    const featuresToUpdate = incomingFeatures.filter(
      (f) => f.id && existingIds.includes(f.id),
    );

    const featuresToCreate = incomingFeatures.filter((f) => !f.id);

    await this.prisma.$transaction([
      this.prisma.planFeatures.deleteMany({
        where: { id: { in: featuresToDelete } },
      }),

      ...featuresToUpdate.map((feature) =>
        this.prisma.planFeatures.update({
          where: { id: feature.id },
          data: { feature: feature.feature },
        }),
      ),

      this.prisma.planFeatures.createMany({
        data: featuresToCreate.map((feature) => ({
          feature: feature.feature,
          planId,
        })),
      }),
    ]);
  }
}
