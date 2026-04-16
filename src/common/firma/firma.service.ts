import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SendForSigningDto } from 'src/modules/document/dto/send-for-signing.dto.js';
import { CustomerService } from '../../modules/customer/customer.service.js';
import { Tenant } from 'src/generated/prisma/client.js';

@Injectable()
export class FirmaService {
  private readonly logger = new Logger(FirmaService.name);
  private readonly api: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly customer: CustomerService,
  ) {
    this.api = axios.create({
      baseURL: this.config.get<string>('FIRMA_API_URL'),
      headers: {
        Authorization: this.config.get<string>('FIRMA_API_KEY'),
        'Content-Type': 'application/json',
      },
    });
  }

  async fetchWorkspaceApiKey(tenant: Tenant) {
    try {
      if (
        tenant.firmaApiKey &&
        tenant.firmaApiKeyAt &&
        Date.now() - tenant.firmaApiKeyAt.getTime() < 55 * 1000
      ) {
        return tenant.firmaApiKey;
      }

      let workplaceId = tenant.firmaWorkspaceId;
      if (!workplaceId) {
        workplaceId = await this.createWorkspace(tenant);
      }

      const res = await this.api.post(
        `/workspaces/${workplaceId}/api-key/regenerate`,
      );

      const apiKey = res.data.new_key.api_key;

      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          firmaApiKey: apiKey,
          firmaApiKeyAt: new Date(),
        },
      });

      return apiKey;
    } catch (error) {
      this.logger.error('Error fetching firma workspace details', error);
      throw error;
    }
  }

  async createWorkspace(tenant: Tenant) {
    try {
      const body = {
        name: tenant.tenantName,
      };

      const res = await this.api.post('/workspaces', body);
      this.logger.log(
        `Created firma workspace for tenant ${tenant.tenantName}, workspace ID: ${res.data.id}`,
      );

      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { firmaWorkspaceId: res.data.id },
      });

      return res.data.id;
    } catch (error) {
      this.logger.error('Error creating firma workspace', error);
      throw error;
    }
  }

  private createTenantClient(apiKey: string) {
    return axios.create({
      baseURL: this.config.get<string>('FIRMA_API_URL'),
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendForSigning(data: SendForSigningDto, tenant: Tenant) {
    try {
      const apiKey = await this.fetchWorkspaceApiKey(tenant);
      const api = this.createTenantClient(apiKey);

      const template = await this.createTemplate(data, api);

      const users = await this.assignUsersToTemplate(
        template.id,
        data.bookingId,
        tenant,
        data,
        api,
      );

      await this.assignFieldsToTemplate(template.id, users, api);

      const signingRequest = await this.createSigningRequest(
        template.id,
        template,
        tenant,
        api,
      );

      const res = await this.sendDocumentForSigning(signingRequest.id, api);

      return res;
    } catch (error) {
      this.logger.error('Error in sendForSigning workflow', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async createTemplate(data: SendForSigningDto, api: AxiosInstance) {
    try {
      const booking = await this.prisma.rental.findUnique({
        where: { id: data.bookingId },
        include: {
          vehicle: true,
          tenant: true,
          agreement: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (!booking.agreement?.agreementUrl) {
        throw new NotFoundException('Agreement URL not found for this booking');
      }

      const document = await this.convertToBase64(
        booking.agreement.agreementUrl,
      );

      const body = {
        name: `Booking Agreement - ${booking?.bookingCode}`,
        description: `Booking agreement for ${booking?.tenant.tenantName}`,
        document,
      };

      const res = await api.post('/templates', body);

      return res.data;
    } catch (error) {
      this.logger.error('Error creating firma template', error);
      throw error;
    }
  }

  async assignUsersToTemplate(
    templateId: string,
    id: string,
    tenant: Tenant,
    data: SendForSigningDto,
    api: AxiosInstance,
  ) {
    try {
      const primaryDriver = await this.customer.getPrimaryDriver(id);

      const representative = await this.prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          email: data.representative,
        },
      });

      const signerUser = {
        first_name: primaryDriver.customer.firstName,
        last_name: primaryDriver.customer.lastName,
        email: data.recipient,
        designation: 'signer',
        order: 1,
      };

      const representativeUser = {
        first_name: representative?.firstName || 'Authorized',
        last_name: representative?.lastName || 'Representative',
        email: data.representative,
        designation: 'signer',
        order: 2,
      };

      const updateBody = {
        users: [signerUser, representativeUser],
      };

      const res = await api.put(`/templates/${templateId}`, updateBody);

      return res.data;
    } catch (error) {
      this.logger.error('Error assigning users to template', error);
      throw error;
    }
  }

  async assignFieldsToTemplate(
    templateId: string,
    data: any,
    api: AxiosInstance,
  ) {
    try {
      const signerUserId = data.recipients?.find((u) => u.order === 1)?.id;
      const representativeUserId = data.recipients?.find(
        (u) => u.order === 2,
      )?.id;

      const fieldsUpdateBody = {
        fields: [
          {
            type: 'signature',
            x: 5.19,
            y: 30.764,
            width: 41.846,
            height: 4.334,
            page: 4,
            required: true,
            assigned_to_user_id: signerUserId,
          },
          {
            type: 'signature',
            x: 52.495,
            y: 30.269,
            width: 41.846,
            height: 4.334,
            page: 4,
            required: false,
            assigned_to_user_id: representativeUserId,
          },
        ],
      };

      await api.put(`/templates/${templateId}`, fieldsUpdateBody);
    } catch (error) {
      this.logger.error('Error assigning fields to template', error);
      throw error;
    }
  }

  async createSigningRequest(
    templateId: string,
    booking: any,
    tenant: Tenant,
    api: AxiosInstance,
  ) {
    try {
      const body = {
        template_id: templateId,
        name: `Signing Request - ${booking.name || 'Agreement'}`,
        description: `Booking agreement for ${tenant.tenantName}`,
        expiration_hours: 168,
      };

      const res = await api.post(`/signing-requests`, body);
      this.logger.log(
        `Created signing request ${res.data.id} for template ${templateId}`,
      );
      return res.data;
    } catch (error) {
      this.logger.error('Error creating signing request', {
        templateId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  async verifySigningRequest(requestId: string, tenant: Tenant) {
    try {
      const apiKey = await this.fetchWorkspaceApiKey(tenant);
      const api = this.createTenantClient(apiKey);

      const res = await api.get(`/signing-requests/${requestId}`);
      this.logger.log(
        `Signing request ${requestId} details: ${JSON.stringify(res.data)}`,
      );
      return res.data;
    } catch (error) {
      this.logger.error('Error verifying signing request', {
        requestId,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async sendDocumentForSigning(requestId: string, api: AxiosInstance) {
    try {
      const res = await api.post(`/signing-requests/${requestId}/send`);
      return res.data;
    } catch (error) {
      this.logger.error('Error sending document for signing', {
        requestId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  async convertToBase64(url: string): Promise<string> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data, 'binary');
    return buffer.toString('base64');
  }
}
