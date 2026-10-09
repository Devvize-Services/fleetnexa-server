import { Global, Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SendTemplatedEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Global()
@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);

  public readonly s3Client: S3Client;

  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';

    const credentials = {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    };

    this.s3Client = new S3Client({
      region: this.region,
      credentials,
    });
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  async getObject(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('Error getting object from S3', error);
      throw error;
    }
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 900) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}
