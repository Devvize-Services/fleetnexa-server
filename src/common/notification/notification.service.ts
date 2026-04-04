import { Global, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { TenantGateway } from '../../gateway/tenant.gateway.js';
import { TenantNotification } from '../../generated/prisma/client.js';
import { UserRepository } from '../../modules/user/user.repository.js';

@Global()
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private client: AxiosInstance;
  private readonly appId: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(
    private readonly tenantGateway: TenantGateway,
    private readonly config: ConfigService,
    private readonly userRepo: UserRepository,
  ) {
    this.appId = this.config.get<string>('ONESIGNAL_APP_ID');
    this.apiKey = this.config.get<string>('ONESIGNAL_API_KEY');

    console.log('ONESIGNAL_APP_ID', this.appId);
    console.log('ONESIGNAL_API_KEY', this.apiKey);

    this.client = axios.create({
      baseURL: 'https://onesignal.com/api/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${this.apiKey}`,
      },
    });
  }

  async sendTenantNotification(tenantId: string, payload: TenantNotification) {
    this.tenantGateway.sendTenantNotification(tenantId, payload);

    await this.sendPushNotification(tenantId, payload);
  }

  private async sendPushNotification(
    tenantId: string,
    payload: TenantNotification,
  ) {
    const users = await this.userRepo.getAllTenantUsers(tenantId);

    const externalIds = users.map((u) => u.id).filter(Boolean);

    if (externalIds.length === 0) return;

    const body = {
      app_id: this.appId,
      contents: { en: payload.message },
      include_aliases: {
        external_id: externalIds,
      },
      target_channel: 'push',
      headings: { en: payload.title || 'New Notification' },
    };

    console.log('Push notification body:', body);

    try {
      const res = await this.client.post('/notifications', body);
    } catch (error) {
      this.logger.error('Error sending push notification', error, {
        tenantId,
        payload,
      });
      throw error;
    }
  }
}
