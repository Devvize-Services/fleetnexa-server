import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'stream';
import { NotFoundException } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from './upload-file.dto.js';
import { ApiGuard } from '../auth/guards/api.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Multer } from 'multer';

@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Get(':id')
  async getMediaById(@Param('id') mediaId: string, @Res() res: Response) {
    const { media, object } = await this.service.getMediaById(mediaId);

    res.setHeader('Content-Type', media.mimeType);

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (object.ContentLength) {
      res.setHeader('Content-Length', object.ContentLength);
    }

    if (object.CacheControl) {
      res.setHeader('Cache-Control', object.CacheControl);
    }

    if (object.Body instanceof Readable) {
      return object.Body.pipe(res);
    }

    throw new NotFoundException('Media content not found');
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async uploadFile(
    @Body() data: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const user = req.user.id;

    return this.service.createMedia(data, file, user);
  }

  @Post('storefront')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(ApiGuard)
  async uploadStorefrontFile(
    @Body() data: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadFile(data, file);
  }
}
