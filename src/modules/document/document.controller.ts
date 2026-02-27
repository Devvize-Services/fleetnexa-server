import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service.js';
import type { AuthenticatedRequest } from '../../types/authenticated-request.js';
import { SendForSigningDto } from './dto/send-for-signing.dto.js';
import { TenantAuthGuard } from '../auth/guards/tenant-auth.guard.js';

@Controller('document')
@UseGuards(TenantAuthGuard)
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post('invoice/:id')
  async generateBookingInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { tenant, user } = req.context;
    return await this.service.generateInvoice(id, tenant, user);
  }

  @Post('agreement/sign')
  async sendAgreementForSignature(
    @Req() req: AuthenticatedRequest,
    @Body() data: SendForSigningDto,
  ) {
    const { tenant } = req.context;
    return await this.service.sendAgreementForSignature(data, tenant);
  }

  @Post('agreement/:id')
  async generateBookingAgreement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { tenant, user } = req.context;
    return await this.service.generateAgreement(id, tenant, user);
  }
}
