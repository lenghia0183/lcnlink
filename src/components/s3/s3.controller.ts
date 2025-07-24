import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  Query,
  Get,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
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
import { DeleteMultipleFilesRequestDto } from './dto/request/delete-file.request.dto';
import { GetPresignedUrlRequestDto } from './dto/request/presigned-url.request.dto';

import { USER_ROLE_ENUM } from '@components/user/user.constant';
import { Roles } from '@core/decorators/role.decorator';
import { ValidateAllFiles } from '@core/decorators/file-validation.decorator';
import { FileValidationInterceptor } from '@core/interceptors/file-validation.interceptor';
import { isEmpty } from 'lodash';
import { Public } from '@core/decorators/public.decorator';
import { ThrottleForUpload } from '@core/decorators/throttle-redis.decorator';

@ApiTags('S3 File Management')
@ApiBearerAuth('JWT-auth')
@Public()
@UseInterceptors(FilesInterceptor('files'))
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload một file lên S3' })
  @ApiResponse({ status: 201, description: 'Upload file thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @ApiConsumes('multipart/form-data')
  @ThrottleForUpload()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
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
      required: ['files'],
    },
  })
  @UseInterceptors(FileValidationInterceptor)
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  @ValidateAllFiles()
  async uploadFile(
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body() payload: UploadFileRequestDto,
  ) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return this.s3Service.uploadMultipleFiles(files, request.folder);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Xóa một file từ S3' })
  @ApiResponse({ status: 200, description: 'Xóa file thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Roles(USER_ROLE_ENUM.USER, USER_ROLE_ENUM.ADMIN)
  async deleteFile(@Body() payload: DeleteMultipleFilesRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }

    return this.s3Service.deleteMultipleFiles(request.keys);
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
