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

@ApiTags('S3 File Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticateGuard, RoleGuard)
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
    @UploadedFile() file: Express.Multer.File,
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
    @UploadedFiles() files: Express.Multer.File[],
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
}
