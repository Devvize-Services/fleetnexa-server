import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadFileDto } from './dto/upload-file.dto.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { AwsService } from '../../common/aws/aws.service.js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly aws: AwsService) {}

  async uploadFile(data: UploadFileDto, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const baseName = data.fileName || fileId;
      const fileName = `${baseName}${fileExtension}`;
      const folderPath = data.folderPath || 'default';
      const normalizedPath = folderPath.replace(/^\/|\/$/g, '');
      const key = `Tenants/${normalizedPath}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'fleetnexa',
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
        },
      });

      await this.aws.s3Client.send(command);

      const bucket = process.env.AWS_BUCKET_NAME || 'fleetnexa';
      const region = process.env.AWS_REGION || 'us-east-1';
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      const createdFile = {
        id: fileId,
        name: file.originalname,
        key,
        url,
        size: file.size,
        type: file.mimetype,
      };

      return createdFile;
    } catch (error) {
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
    } catch (error) {
      this.logger.error('File deletion failed', error);
      throw error;
    }
  }
}
