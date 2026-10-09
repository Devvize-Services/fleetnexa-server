import {
  BadRequestException,
  Global,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UploadFileDto } from './upload-file.dto.js';
import { randomUUID, createHash } from 'crypto';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { AwsService } from '../../infrastructure/aws/aws.service.js';
import type { Multer } from 'multer';
import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service.js';

@Global()
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly bucketName: string;
  private readonly region: string;
  private readonly backendUrl: string;

  constructor(
    private readonly aws: AwsService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.backendUrl = this.configService.get<string>('BACKEND_URL') || '';
  }

  async getMediaById(mediaId: string) {
    try {
      const media = await this.prisma.media.findUnique({
        where: {
          id: mediaId,
        },
      });

      if (!media) {
        this.logger.warn(`Media with ID "${mediaId}" not found`);
        throw new NotFoundException('Media not found');
      }

      const object = await this.aws.getObject(media.path);

      return {
        media,
        object,
      };
    } catch (error) {
      this.logger.error('Error fetching media by ID', error);
      throw error;
    }
  }

  async getMediaContentById(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      this.logger.warn(`Media with ID "${mediaId}" not found`);
      throw new NotFoundException('Media not found');
    }

    return {
      id: media.id,
      fileName: media.fileName,
      originalName: media.originalName,
      mimeType: media.mimeType,
      extension: media.extension,
      size: media.size,
    };
  }

  async getMediaUrl(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return this.aws.getSignedUrl(media.path);
  }

  async createMedia(
    data: UploadFileDto,
    file: Express.Multer.File,
    userId?: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const upload = await this.uploadFile(data, file);
      const metadata = await this.getMediaMetadata(file);

      const url = `${this.backendUrl}/storage/${upload.id}`;

      const media = await this.prisma.media.create({
        data: {
          id: upload.id,
          fileName: upload.fileName,
          originalName: upload.originalName,
          path: upload.key,
          bucket: this.bucketName,
          mimeType: upload.type,
          extension: upload.extension,
          size: upload.size,
          type: data.type,
          createById: userId || '',
          url: url,
          width: metadata.width,
          height: metadata.height,
          duration: metadata.duration,
          checksum: metadata.checksum,
          altText: data.altText,
          caption: data.caption,
          permanentlyDeleteAt: null,
        },
      });

      return {
        message: 'Media uploaded successfully',
        media: {
          id: media.id,
          fileName: media.fileName,
          originalName: media.originalName,
          url: media.url,
        },
      };
    } catch (error: any) {
      this.logger.error('Media creation failed', error);
      throw error;
    }
  }

  async uploadFile(data: UploadFileDto, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const today = new Date();
      const normalizedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const fileId = randomUUID();
      const fileExtension = path.extname(file.originalname);
      const baseName = data.fileName || fileId;
      const fileName = `${baseName}${fileExtension}`;
      const s3Key = `${normalizedDate}/${data.type.toLowerCase()}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'fleetnexa',
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
        },
      });

      await this.aws.s3Client.send(command);

      return {
        id: fileId,
        fileName: fileName,
        originalName: file.originalname,
        key: s3Key,
        size: file.size,
        type: file.mimetype,
        extension: fileExtension,
      };
    } catch (error: any) {
      this.logger.error('File upload failed', error);
      throw error;
    }
  }

  async deleteFile(fileKey: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'fleetnexa',
        Key: fileKey,
      });

      await this.aws.s3Client.send(command);
      return true;
    } catch (error: any) {
      this.logger.error('File deletion failed', error);
      throw error;
    }
  }

  private async getMediaMetadata(file: Express.Multer.File) {
    const metadata: {
      width?: number;
      height?: number;
      duration?: number;
      checksum?: string;
    } = {};

    metadata.checksum = createHash('sha256').update(file.buffer).digest('hex');

    if (file.mimetype.startsWith('image/')) {
      const imageMetadata = await sharp(file.buffer).metadata();

      metadata.width = imageMetadata.width;
      metadata.height = imageMetadata.height;
    }

    return metadata;
  }
}
