import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AllConfigType, AwsConfig } from '@config/config.type';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';

import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { I18nErrorKeys } from '@constant/i18n-keys.enum';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly i18n: I18nService,
  ) {
    const awsConfig = this.configService.get<AwsConfig>('aws');

    this.s3Client = new S3Client({
      region: awsConfig?.region || 'us-east-1',
      credentials: {
        accessKeyId: awsConfig?.accessKeyId || '',
        secretAccessKey: awsConfig?.secretAccessKey || '',
      },
    });

    this.bucketName = awsConfig?.s3BucketName || '';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    customFileName?: string,
  ) {
    try {
      const fileName = this.generateFileName(file.originalname, customFileName);
      const key = this.getS3ObjectKey(
        file.originalname,
        folder,
        customFileName,
      );

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      });

      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;

      return (
        await new ResponseBuilder({
          fileName,
          originalName: file.originalname,
          fileUrl,
          key,
          size: file.size,
          mimeType: file.mimetype,
        }).withCodeI18n(ResponseCodeEnum.SUCCESS)
      ).build();
    } catch (error) {
      this.logger.error('Error uploading file to S3:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage(I18nErrorKeys.UPLOAD_FAILED)
        .build();
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder?: string) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, folder, undefined),
      );

      const results = await Promise.all(uploadPromises);

      const successfulUploads = results.filter(
        (result) => result.statusCode === ResponseCodeEnum.SUCCESS,
      );

      return (
        await new ResponseBuilder({
          uploadedFiles: successfulUploads.map((result) => result.data),
          totalFiles: files.length,
          successfulUploads: successfulUploads.length,
        }).withCodeI18n(ResponseCodeEnum.SUCCESS)
      ).build();
    } catch (error) {
      this.logger.error('Error uploading multiple files to S3:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage(I18nErrorKeys.UPLOAD_FAILED)
        .build();
    }
  }

  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      return (
        await new ResponseBuilder({
          deletedKey: key,
        }).withCodeI18n(ResponseCodeEnum.SUCCESS)
      ).build();
    } catch (error) {
      this.logger.error('Error deleting file from S3:', error);
      return new ResponseBuilder<{ deletedKey: string }>()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage(I18nErrorKeys.DELETE_FAILED)
        .build();
    }
  }

  async deleteMultipleFiles(keys: string[]) {
    try {
      const deletePromises = keys.map((key) => this.deleteFile(key));
      const results = await Promise.all(deletePromises);

      const successfulDeletes = results.filter(
        (result) => result.statusCode === ResponseCodeEnum.SUCCESS,
      );

      return (
        await new ResponseBuilder({
          deletedFiles: successfulDeletes.map((result) => result.data),
          totalFiles: keys.length,
          successfulDeletes: successfulDeletes.length,
        }).withCodeI18n(ResponseCodeEnum.SUCCESS)
      ).build();
    } catch (error) {
      this.logger.error('Error deleting multiple files from S3:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage(I18nErrorKeys.DELETE_FAILED)
        .build();
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return (
        await new ResponseBuilder({
          presignedUrl,
          key,
          expiresIn,
        }).withCodeI18n(ResponseCodeEnum.SUCCESS)
      ).build();
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage(I18nErrorKeys.GET_PRE_URL_FAILED)
        .build();
    }
  }

  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  private generateFileName(
    originalName: string,
    customFileName?: string,
  ): string {
    if (customFileName) return customFileName;

    const now = new Date();
    const isoStringSafe = now
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-');

    const fileExtension = originalName.split('.').pop() || 'bin';
    const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
    const safeName = slugify(nameWithoutExt, { lower: true, strict: true });
    const uuid = uuidv4();

    return `${isoStringSafe}--${safeName}--${uuid}.${fileExtension}`;
  }

  private getS3ObjectKey(
    originalName: string,
    folder?: string,
    customFileName?: string,
  ): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const fileName = this.generateFileName(originalName, customFileName);
    const basePath = `${folder || 'uploads'}/${yyyy}/${mm}/${dd}`;

    return `${basePath}/${fileName}`;
  }
}
