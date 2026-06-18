import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MessageCode } from '../common/constants/message-codes';

@Injectable()
export class StorageService {
  private s3Client?: S3Client;
  private presignClient?: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = undefined;
  }

  async generatePresignedUploadUrl(fileKey: string, contentType: string, expiresInSeconds = 900): Promise<{ uploadUrl: string; fileKey: string; expiresInSeconds: number }> {
    const s3Client = this.getPresignClient();
    const bucket = this.getRequiredConfig('AWS_S3_BUCKET');
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return { uploadUrl, fileKey, expiresInSeconds };
  }

  getPublicUrl(fileKey: string): string {
    const bucket = this.getRequiredConfig('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_S3_REGION') || 'auto';
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');

    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;
    }

    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${bucket}/${fileKey}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const s3Client = this.getS3Client();
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.getRequiredConfig('AWS_S3_BUCKET'),
        Key: fileKey,
      }),
    );
  }

  private getS3Client(): S3Client {
    if (this.s3Client) {
      return this.s3Client;
    }

    const region = this.configService.get<string>('AWS_S3_REGION') || 'auto';
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: this.getRequiredConfig('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.getRequiredConfig('AWS_SECRET_ACCESS_KEY'),
      },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    return this.s3Client;
  }

  private getPresignClient(): S3Client {
    if (this.presignClient) {
      return this.presignClient;
    }

    const region = this.configService.get<string>('AWS_S3_REGION') || 'auto';
    const endpoint = this.configService.get<string>('AWS_S3_PRESIGN_ENDPOINT') || this.configService.get<string>('AWS_S3_ENDPOINT');

    this.presignClient = new S3Client({
      region,
      credentials: {
        accessKeyId: this.getRequiredConfig('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.getRequiredConfig('AWS_SECRET_ACCESS_KEY'),
      },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    return this.presignClient;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException({
        message: `${key} is required for storage operations`,
        messageCode: MessageCode.STORAGE_CONFIG_MISSING,
      });
    }

    return value;
  }
}
