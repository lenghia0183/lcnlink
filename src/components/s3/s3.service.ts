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
import { ResponsePayload } from '@utils/response-payload';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';

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

  /**
   * Upload file to S3 (validation should be done by pipe before reaching this method)
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    customFileName?: string,
  ): Promise<
    ResponsePayload<{
      fileName: string;
      originalName: string;
      fileUrl: string;
      key: string;
      size: number;
      mimeType: string;
    }>
  > {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = customFileName || `${uuidv4()}.${fileExtension}`;
      const key = folder ? `${folder}/${fileName}` : fileName;

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
        }).withCodeI18n(ResponseCodeEnum.SUCCESS, this.i18n)
      ).build();
    } catch (error) {
      this.logger.error('Error uploading file to S3:', error);
      return new ResponseBuilder<{
        fileName: string;
        originalName: string;
        fileUrl: string;
        key: string;
        size: number;
        mimeType: string;
      }>()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to upload file')
        .build();
    }
  }

  /**
   * Upload multiple files to S3 (validation should be done by pipe before reaching this method)
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<
    ResponsePayload<{
      uploadedFiles: Array<
        | {
            fileName: string;
            originalName: string;
            fileUrl: string;
            key: string;
            size: number;
            mimeType: string;
          }
        | undefined
      >;
      totalFiles: number;
      successfulUploads: number;
    }>
  > {
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
        }).withCodeI18n(ResponseCodeEnum.SUCCESS, this.i18n)
      ).build();
    } catch (error) {
      this.logger.error('Error uploading multiple files to S3:', error);
      return new ResponseBuilder<{
        uploadedFiles: Array<
          | {
              fileName: string;
              originalName: string;
              fileUrl: string;
              key: string;
              size: number;
              mimeType: string;
            }
          | undefined
        >;
        totalFiles: number;
        successfulUploads: number;
      }>()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to upload files')
        .build();
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(
    key: string,
  ): Promise<ResponsePayload<{ deletedKey: string }>> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      return (
        await new ResponseBuilder({
          deletedKey: key,
        }).withCodeI18n(ResponseCodeEnum.SUCCESS, this.i18n)
      ).build();
    } catch (error) {
      this.logger.error('Error deleting file from S3:', error);
      return new ResponseBuilder<{ deletedKey: string }>()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to delete file')
        .build();
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMultipleFiles(keys: string[]): Promise<
    ResponsePayload<{
      deletedFiles: Array<{ deletedKey: string } | undefined>;
      totalFiles: number;
      successfulDeletes: number;
    }>
  > {
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
        }).withCodeI18n(ResponseCodeEnum.SUCCESS, this.i18n)
      ).build();
    } catch (error) {
      this.logger.error('Error deleting multiple files from S3:', error);
      return new ResponseBuilder<{
        deletedFiles: Array<{ deletedKey: string } | undefined>;
        totalFiles: number;
        successfulDeletes: number;
      }>()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to delete files')
        .build();
    }
  }

  /**
   * Check if file exists in S3
   */
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

  /**
   * Generate presigned URL for file access
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<
    ResponsePayload<{
      presignedUrl: string;
      key: string;
      expiresIn: number;
    }>
  > {
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
        }).withCodeI18n(ResponseCodeEnum.SUCCESS, this.i18n)
      ).build();
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      return new ResponseBuilder<{
        presignedUrl: string;
        key: string;
        expiresIn: number;
      }>()
        .withCode(ResponseCodeEnum.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to generate presigned URL')
        .build();
    }
  }

  /**
   * Get file URL (public access)
   */
  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
