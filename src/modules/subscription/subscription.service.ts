import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Tenant } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantRepository } from '../tenant/tenant.repository.js';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepo: TenantRepository,
  ) {}

  async updateSubscription(planId: string, tenant: Tenant) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        this.logger.warn(`Subscription plan with id ${planId} not found.`);
        throw new NotFoundException('Subscription plan not found.');
      }

      const exitingPlan = await this.prisma.tenantSubscription.findUnique({
        where: { tenantId: tenant.id },
      });

      if (exitingPlan && exitingPlan.planId === plan.id) {
        this.logger.log(
          `Tenant ${tenant.id} is already subscribed to plan ${plan.id}. No update needed.`,
        );
        return;
      }

      const endDate =
        plan.period === 'MONTHLY'
          ? new Date(new Date().setMonth(new Date().getMonth() + 1))
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

      await this.prisma.tenantSubscription.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          planId: plan.id,
          startDate: new Date(),
          endDate: endDate,
        },
        update: {
          planId: plan.id,
        },
      });

      const updatedTenant = await this.tenantRepo.getTenantById(tenant.id);
      this.logger.log(
        `Subscription for tenant ${tenant.id} updated to plan ${plan.id}.`,
      );
      return {
        message: 'Subscription updated successfully',
        tenant: updatedTenant,
      };
    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      throw error;
    }
  }

  async renewSubscription(tenant: Tenant) {}
}
