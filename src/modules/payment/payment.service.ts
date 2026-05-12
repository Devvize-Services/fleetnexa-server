import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import DodoPayments from 'dodopayments';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Tenant } from '../../generated/prisma/client.js';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly client: DodoPayments;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = new DodoPayments({
      bearerToken: this.config.get<string>('DODO_API_KEY'),
      environment: this.config.get<string>('DODO_ENVIRONMENT') as
        | 'test_mode'
        | 'live_mode',
    });
  }

  async createSubscriptionSession(productId: string, tenant: Tenant) {
    try {
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const session = await this.client.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: this.config.get<string>('DODO_RETURN_URL'),
        metadata: {
          tenantId: tenant.id,
          tenantName: tenant.tenantName,
        },
      });

      return {
        message: 'Checkout session created successfully',
        sessionId: session.session_id,
        checkoutUrl: session.checkout_url,
      };
    } catch (error) {
      this.client.logger.error('Error creating checkout session', error);
      throw error;
    }
  }

  async handleWebhook(body: any) {
    try {
      console.log('Received webhook:', body);
      const tenantId = body.metadata?.tenantId;
      if (body.type === 'subscription.active') {
        await this.prisma.tenantSubscription.upsert({
          where: { tenantId: tenantId },
          update: {
            status: 'ACTIVE',
            planId: body.subscription_id,
          },
          create: {
            tenantId: tenantId,
            planId: body.subscription_id,
            status: 'ACTIVE',
          },
        });
      }
    } catch (error) {
      this.logger.error('Error handling webhook', error);
      throw error;
    }
  }
}
