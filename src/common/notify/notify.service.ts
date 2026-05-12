import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SendEmailDto } from './dto/send-email.dto.js';
import { SendWhatsAppDto } from './dto/send-whatsapp.dto.js';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);
  private readonly api: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.api = axios.create({
      baseURL: this.config.get<string>('NOTIFY_API_URL'),
      headers: {
        'x-api-key': this.config.get<string>('NOTIFY_API_KEY'),
        'Content-Type': 'application/json',
      },
    });
  }

  async sendEmail(payload: SendEmailDto) {
    try {
      const res = await this.api.post('email/send', payload);

      this.logger.log(`Email sent: ${res.data.messageId}`);
      return res.data;
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }

  async verifyNumber(phoneNumber: string) {
    try {
      const res = await this.api.get('whatsapp/verify', {
        params: { phoneNumber },
      });

      this.logger.log(`Phone number verified: ${phoneNumber}`);
      return res.data;
    } catch (error) {
      this.logger.error('Error verifying phone number', error);
      throw error;
    }
  }

  async sendWhatsapp(payload: SendWhatsAppDto) {
    try {
      const res = await this.api.post('whatsapp/send', payload);

      this.logger.log(`WhatsApp message sent: ${res.data.messageId}`);
      return res.data;
    } catch (error) {
      this.logger.error('Error sending WhatsApp message', error);
      throw error;
    }
  }
}
