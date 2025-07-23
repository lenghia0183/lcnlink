import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import {
  FILE_VALIDATION_KEY,
  FileValidationConfig,
} from '@core/decorators/file-validation.decorator';
import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { I18nErrorKeys } from '@constant/i18n-keys.enum';

interface RequestWithFiles extends Request {
  file?: Express.Multer.File;
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const config = this.reflector.get<FileValidationConfig>(
      FILE_VALIDATION_KEY,
      context.getHandler(),
    );

    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithFiles>();

    const files = request.files;

    console.log('files', files);

    if (!files || files.length === 0) {
      if (config.required) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.FILE_REQUIRED),
          ResponseCodeEnum.BAD_REQUEST,
        );
      }
    }

    // Validate multiple files
    if (files) {
      if (Array.isArray(files)) {
        await this.validateMultipleFiles(files, config);
      } else {
        // Handle files object with fieldnames
        const fileArrays = Object.values(files);
        for (const fileArray of fileArrays) {
          await this.validateMultipleFiles(fileArray, config);
        }
      }
    }

    return next.handle();
  }

  private async validateSingleFile(
    file: Express.Multer.File,
    config: FileValidationConfig,
  ): Promise<void> {
    await this.validateFileProperties(file, config);
  }

  private async validateMultipleFiles(
    files: Express.Multer.File[],
    config: FileValidationConfig,
  ): Promise<void> {
    // Check file count
    if (config.maxFiles && files.length > config.maxFiles) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.TOO_MANY_FILES, {
          args: { maxFiles: config.maxFiles },
        }),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Validate each file
    for (const file of files) {
      await this.validateFileProperties(file, config);
    }
  }

  private async validateFileProperties(
    file: Express.Multer.File,
    config: FileValidationConfig,
  ): Promise<void> {
    // Check file size
    if (file.size > config.maxSize) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FILE_SIZE_TOO_LARGE, {
          args: { maxSize: this.formatFileSize(config.maxSize) },
        }),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FILE_TYPE_NOT_ALLOWED, {
          args: {
            fileType: file.mimetype,
            allowedTypes: config.allowedMimeTypes.join(', '),
          },
        }),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Check extension
    const fileExtension = this.getFileExtension(file.originalname);
    if (!config.allowedExtensions.includes(fileExtension.toLowerCase())) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FILE_EXTENSION_NOT_ALLOWED, {
          args: {
            extension: fileExtension,
            allowedExtensions: config.allowedExtensions.join(', '),
          },
        }),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Check valid filename
    if (!this.isValidFileName(file.originalname)) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.INVALID_FILE_NAME),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }
  }

  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private isValidFileName(filename: string): boolean {
    // Check for invalid characters in filename
    const invalidChars = /[<>:"/\\|?*]/;
    const hasControlChars = filename.split('').some((char) => {
      const code = char.charCodeAt(0);
      return code >= 0 && code <= 31;
    });

    return (
      !invalidChars.test(filename) && !hasControlChars && filename.length > 0
    );
  }
}
