import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFileRequestDto {
  @ApiProperty({
    description: 'Thư mục để lưu file (tùy chọn)',
    example: 'avatars',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string;

  @ApiProperty({
    description: 'Tên file tùy chỉnh (tùy chọn)',
    example: 'my-custom-filename',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customFileName?: string;
}
