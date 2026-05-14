import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VillageService } from './village.service.js';
import { VillageDto } from './village.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { validateExcelColumns } from '../../../utils/excel.utils.js';

@Controller('dashboard/village')
export class VillageController {
  constructor(private readonly service: VillageService) {}

  @Get()
  async getVillages() {
    return this.service.getVillages();
  }

  @Post()
  async createVillage(@Body() data: VillageDto) {
    return this.service.createVillage(data);
  }

  @Put()
  async updateVillage(@Body() data: VillageDto) {
    return this.service.updateVillage(data);
  }

  @Delete(':id')
  async deleteVillage(@Param('id') id: string) {
    return this.service.deleteVillage(id);
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  async bulkCreateVillages(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const { valid, missingColumns } = validateExcelColumns(data, [
      'village',
      'state',
      'country',
    ]);
    if (!valid) {
      throw new BadRequestException(
        `Missing required columns: ${missingColumns?.join(', ') || 'unknown'}`,
      );
    }

    return this.service.bulkCreateVillages(data);
  }
}
