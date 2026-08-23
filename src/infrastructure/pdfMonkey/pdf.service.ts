import { Global, Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { AwsService } from '../aws/aws.service.js';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  AgreementData,
  CreateDocumentParams,
  InvoiceData,
  PaymentReceiptData,
} from '../../types/pdf.js';
import { PDFDocument } from 'pdf-lib';

@Global()
@Injectable()
export class PdfMonkeyService {
  private readonly logger = new Logger(PdfMonkeyService.name);
  private readonly pdfMonkeyApi: AxiosInstance;
  private readonly invoiceId: string;
  private readonly agreementId: string;
  private readonly awsBucketName: string;
  private readonly paymentReceiptId: string;

  constructor(
    private readonly aws: AwsService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('PDFMONKEY_API_KEY');
    this.invoiceId = this.config.get<string>('PDFMONKEY_INVOICE_ID') ?? '';
    this.agreementId = this.config.get<string>('PDFMONKEY_AGREEMENT_ID') ?? '';
    this.paymentReceiptId =
      this.config.get<string>('PDFMONKEY_PAYMENT_RECEIPT_ID') ?? '';
    this.awsBucketName = this.config.get<string>('AWS_BUCKET_NAME') ?? '';

    this.pdfMonkeyApi = axios.create({
      baseURL: 'https://api.pdfmonkey.io/api/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  createInvoice = async (
    invoiceData: InvoiceData,
    invoiceNumber: string,
    tenantCode: string,
  ) => {
    const { s3Key, documentId, publicUrl } = await this.createDocument({
      data: invoiceData,
      documentType: 'invoice',
      documentNumber: invoiceNumber,
      tenantCode,
    });
    return { s3Key, documentId, publicUrl };
  };

  createPaymentReceipt = async (
    paymentReceiptData: PaymentReceiptData,
    receiptNumber: string,
    tenantCode: string,
  ) => {
    const { s3Key, documentId, publicUrl } = await this.createDocument({
      data: paymentReceiptData,
      documentType: 'payment_receipt',
      documentNumber: receiptNumber,
      tenantCode,
    });
    return { s3Key, documentId, publicUrl };
  };

  createAgreement = async (
    agreementData: AgreementData,
    agreementNumber: string,
    tenantCode: string,
  ) => {
    const { s3Key, documentId, publicUrl, signablePublicUrl } =
      await this.createDocument({
        data: agreementData,
        documentType: 'agreement',
        documentNumber: agreementNumber,
        tenantCode,
      });
    return { s3Key, documentId, publicUrl, signablePublicUrl };
  };

  private async getPDFFromS3(bucketName: string, key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.aws.s3Client.send(command);
      return (await this.streamToBuffer(response.Body)) as Buffer;
    } catch (error: any) {
      this.logger.error(error, 'Failed to get PDF from S3', {
        bucketName,
        key,
      });
      throw error;
    }
  }

  private async streamToBuffer(stream: any) {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private async createDocument({
    data,
    documentType,
    documentNumber,
    tenantCode,
  }: CreateDocumentParams) {
    let templateId: string;
    let folder: string;

    switch (documentType) {
      case 'invoice':
        templateId = this.invoiceId;
        break;
      case 'agreement':
        templateId = this.agreementId;
        break;
      case 'payment_receipt':
        templateId = this.paymentReceiptId;
        break;
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }

    switch (documentType) {
      case 'invoice':
        folder = 'Invoices';
        break;
      case 'agreement':
        folder = 'Agreements';
        break;
      case 'payment_receipt':
        folder = 'PaymentReceipts';
        break;
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }

    try {
      const res = await this.pdfMonkeyApi.post('/documents', {
        document: {
          document_template_id: templateId,
          payload: data,
          status: 'pending',
          meta: {
            _filename: `${documentNumber}.pdf`,
          },
        },
      });

      const document = res.data.document;
      const documentId = document.id;

      if (!documentId) {
        throw new Error('Document ID not found in response');
      }

      const documentDetails = await this.waitForDocumentGeneration(documentId);
      const pdfBuffer = await this.downloadPdf(
        documentDetails.data.document.download_url,
      );

      const s3Key = `Tenants/${tenantCode}/${folder}/${documentNumber}.pdf`;
      const publicUrl = await this.uploadToS3(pdfBuffer, s3Key);

      if (documentType === 'agreement') {
        const additionalPageUrl =
          'https://fleetnexa.s3.us-east-1.amazonaws.com/Global+Images/BookingAgreementPage.pdf';
        const additionalPageBuffer = await this.downloadPdf(additionalPageUrl);

        const signablePdfBuffer = await this.replaceLastPage(
          pdfBuffer,
          additionalPageBuffer,
        );

        const signableS3Key = `Tenants/${tenantCode}/${folder}/${documentNumber}_signable.pdf`;
        const signablePublicUrl = await this.uploadToS3(
          signablePdfBuffer,
          signableS3Key,
        );

        return {
          s3Key,
          documentId,
          publicUrl,
          signableS3Key,
          signablePublicUrl,
        };
      }

      return { s3Key, documentId, publicUrl };
    } catch (error: any) {
      console.error(`Error creating ${documentType}:`, error);
      throw new Error(`Failed to create ${documentType}`);
    }
  }

  async waitForDocumentGeneration(documentId: string, maxAttempts = 10) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const documentDetails = await this.pdfMonkeyApi.get(
        `/documents/${documentId}`,
      );
      const status = documentDetails.data.document.status;

      if (status === 'success') return documentDetails;
      if (status === 'failed') throw new Error('PDF generation failed');
    }

    throw new Error('PDF generation timed out');
  }

  async downloadPdf(downloadUrl: string): Promise<Buffer> {
    const pdfResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(pdfResponse.data, 'binary');
  }

  uploadToS3 = async (pdfBuffer: Buffer, s3Key: string) => {
    const uploadParams = {
      Bucket: this.awsBucketName,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    };
    await this.aws.s3Client.send(new PutObjectCommand(uploadParams));

    return `https://${this.awsBucketName}.s3.amazonaws.com/${s3Key}`;
  };

  replaceLastPage = async (
    originalPdfBuffer: Buffer,
    newPageBuffer: Buffer,
  ) => {
    try {
      const originalPdfDoc = await PDFDocument.load(originalPdfBuffer);
      const newPagePdfDoc = await PDFDocument.load(newPageBuffer);

      const pageIndices = Array.from(
        { length: originalPdfDoc.getPageCount() - 1 },
        (_, i) => i,
      );
      const newPdfDoc = await PDFDocument.create();

      const pages = await newPdfDoc.copyPages(originalPdfDoc, pageIndices);
      pages.forEach((page) => newPdfDoc.addPage(page));

      const [newLastPage] = await newPdfDoc.copyPages(newPagePdfDoc, [0]);
      newPdfDoc.addPage(newLastPage);

      const mergedPdfBytes = await newPdfDoc.save();
      return Buffer.from(mergedPdfBytes);
    } catch (error: any) {
      console.error('Error replacing last PDF page:', error);
      throw new Error('Failed to replace last page');
    }
  };
}
