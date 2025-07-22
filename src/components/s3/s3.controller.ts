import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { UploadFileRequestDto } from './dto/request/upload-file.request.dto';
import {
  DeleteFileRequestDto,
  DeleteMultipleFilesRequestDto,
} from './dto/request/delete-file.request.dto';
import { GetPresignedUrlRequestDto } from './dto/request/presigned-url.request.dto';
import { AuthenticateGuard } from '@core/guards/authenticate.guard';
import { RoleGuard } from '@core/guards/role.guard';

import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { Roles } from '@core/decorators/role.decorator';
import {
  ValidateImageFile,
  ValidateDocumentFile,
  ValidateAvatarFile,
  ValidateVideoFile,
  ValidateAudioFile,
  ValidateSpreadsheetFile,
  ValidateArchiveFile,
} from '@core/decorators/file-validation.decorator';
import { FileValidationInterceptor } from '@core/interceptors/file-validation.interceptor';

@ApiTags('S3 File Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticateGuard, RoleGuard)
@UseInterceptors(FileValidationInterceptor)
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload một file lên S3' })
  @ApiResponse({ status: 201, description: 'Upload file thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File cần upload',
        },
        folder: {
          type: 'string',
          description: 'Thư mục để lưu file (tùy chọn)',
          example: 'avatars',
        },
        customFileName: {
          type: 'string',
          description: 'Tên file tùy chỉnh (tùy chọn)',
          example: 'my-custom-filename',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder,
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload nhiều file lên S3' })
  @ApiResponse({ status: 201, description: 'Upload files thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách file cần upload',
        },
        folder: {
          type: 'string',
          description: 'Thư mục để lưu file (tùy chọn)',
          example: 'documents',
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Giới hạn 10 files
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadMultipleFiles(
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadMultipleFiles(files, uploadFileDto.folder);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Xóa một file từ S3' })
  @ApiResponse({ status: 200, description: 'Xóa file thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async deleteFile(@Body() deleteFileDto: DeleteFileRequestDto) {
    return this.s3Service.deleteFile(deleteFileDto.key);
  }

  @Delete('delete-multiple')
  @ApiOperation({ summary: 'Xóa nhiều file từ S3' })
  @ApiResponse({ status: 200, description: 'Xóa files thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async deleteMultipleFiles(
    @Body() deleteMultipleFilesDto: DeleteMultipleFilesRequestDto,
  ) {
    return this.s3Service.deleteMultipleFiles(deleteMultipleFilesDto.keys);
  }

  @Get('presigned-url')
  @ApiOperation({ summary: 'Tạo URL có chữ ký để truy cập file' })
  @ApiResponse({ status: 200, description: 'Tạo presigned URL thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async getPresignedUrl(@Query() presignedUrlDto: GetPresignedUrlRequestDto) {
    return this.s3Service.getPresignedUrl(
      presignedUrlDto.key,
      presignedUrlDto.expiresIn,
    );
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload ảnh lên S3 (chỉ cho phép file ảnh)' })
  @ApiResponse({ status: 201, description: 'Upload ảnh thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không phải là ảnh hoặc quá lớn',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateImageFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'images',
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-document')
  @ApiOperation({ summary: 'Upload tài liệu lên S3 (PDF, Word, Excel, etc.)' })
  @ApiResponse({ status: 201, description: 'Upload tài liệu thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không phải là tài liệu hợp lệ',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateDocumentFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'documents',
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-avatar')
  @ApiOperation({ summary: 'Upload avatar (ảnh nhỏ, tối đa 2MB)' })
  @ApiResponse({ status: 201, description: 'Upload avatar thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không phải là ảnh hoặc quá lớn (tối đa 2MB)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateAvatarFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'avatars',
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-video')
  @ApiOperation({ summary: 'Upload video lên S3 (MP4, MPEG, MOV, AVI, WEBM)' })
  @ApiResponse({ status: 201, description: 'Upload video thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không phải là video hợp lệ hoặc quá lớn (tối đa 100MB)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateVideoFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'videos',
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-audio')
  @ApiOperation({ summary: 'Upload audio lên S3 (MP3, WAV, OGG, M4A, WEBM)' })
  @ApiResponse({ status: 201, description: 'Upload audio thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không phải là audio hợp lệ hoặc quá lớn (tối đa 20MB)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateAudioFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'audios',
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-spreadsheet')
  @ApiOperation({ summary: 'Upload spreadsheet lên S3 (XLS, XLSX, CSV)' })
  @ApiResponse({ status: 201, description: 'Upload spreadsheet thành công' })
  @ApiResponse({
    status: 400,
    description:
      'File không phải là spreadsheet hợp lệ hoặc quá lớn (tối đa 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateSpreadsheetFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadSpreadsheet(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'spreadsheets',
      uploadFileDto.customFileName,
    );
  }

  @Post('upload-archive')
  @ApiOperation({ summary: 'Upload archive lên S3 (ZIP, RAR, 7Z, GZIP)' })
  @ApiResponse({ status: 201, description: 'Upload archive thành công' })
  @ApiResponse({
    status: 400,
    description:
      'File không phải là archive hợp lệ hoặc quá lớn (tối đa 100MB)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ValidateArchiveFile()
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async uploadArchive(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileRequestDto,
  ) {
    return this.s3Service.uploadFile(
      file,
      uploadFileDto.folder || 'archives',
      uploadFileDto.customFileName,
    );
  }
}
