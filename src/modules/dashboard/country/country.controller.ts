import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CountryService } from './country.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { validateExcelColumns } from '../../../utils/excel.utils.js';

@Controller('dashboard/country')
export class CountryController {
  constructor(private readonly service: CountryService) {}

  @Get()
  async getCountries() {
    return this.service.getCountries();
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const { valid, missingColumns } = validateExcelColumns(data, ['brand']);
    if (!valid) {
      throw new BadRequestException(
        `Missing required columns: ${missingColumns?.join(', ') || 'unknown'}`,
      );
    }

    return this.service.bulkCreateCountries(data);
  }
}
