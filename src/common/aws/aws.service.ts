import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { SendTemplatedEmailCommand, SESClient } from '@aws-sdk/client-ses';

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
}
