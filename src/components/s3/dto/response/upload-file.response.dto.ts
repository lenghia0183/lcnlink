import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseDto } from '@core/dto/base.request.dto';

export class UploadFileResponseDto extends BaseDto<UploadFileResponseDto> {
  @ApiProperty({
    description: 'Tên file đã được tạo',
    example: 'abc123.jpg',
  })
  @Expose()
  fileName: string;

  @ApiProperty({
    description: 'Tên file gốc',
    example: 'my-photo.jpg',
  })
  @Expose()
  originalName: string;

  @ApiProperty({
    description: 'URL công khai của file',
    example: 'https://my-bucket.s3.amazonaws.com/avatars/abc123.jpg',
  })
  @Expose()
  fileUrl: string;

  @ApiProperty({
    description: 'Key của file trong S3',
    example: 'avatars/abc123.jpg',
  })
  @Expose()
  key: string;

  @ApiProperty({
    description: 'Kích thước file (bytes)',
    example: 1024000,
  })
  @Expose()
  size: number;

  @ApiProperty({
    description: 'Loại MIME của file',
    example: 'image/jpeg',
  })
  @Expose()
  mimeType: string;
}

export class UploadMultipleFilesResponseDto extends BaseDto<UploadMultipleFilesResponseDto> {
  @ApiProperty({
    description: 'Danh sách file đã upload thành công',
    type: [UploadFileResponseDto],
  })
  @Expose()
  uploadedFiles: UploadFileResponseDto[];

  @ApiProperty({
    description: 'Tổng số file',
    example: 5,
  })
  @Expose()
  totalFiles: number;

  @ApiProperty({
    description: 'Số file upload thành công',
    example: 4,
  })
  @Expose()
  successfulUploads: number;
}
