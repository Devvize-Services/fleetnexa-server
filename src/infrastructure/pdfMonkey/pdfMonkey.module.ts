import { Global, Module } from '@nestjs/common';
import { PdfMonkeyService } from './pdf.service.js';
import { AwsModule } from '../aws/aws.module.js';

@Global()
@Module({
  imports: [AwsModule],
  providers: [PdfMonkeyService],
  exports: [PdfMonkeyService],
})
export class PdfMonkeyModule {}
