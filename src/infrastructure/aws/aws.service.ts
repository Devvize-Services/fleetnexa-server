import { Global, Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SendTemplatedEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Global()
@Injectable()
export class AwsService {
  public readonly s3Client: S3Client;
  public readonly sesClient: SESClient;

  constructor() {
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    };

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials,
    });

    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials,
    });
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 900) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}
