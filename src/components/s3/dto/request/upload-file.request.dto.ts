import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UploadFileRequestDto extends BaseDto<UploadFileRequestDto> {
  @ApiProperty({
    description: 'Thư mục để lưu file (tùy chọn, không chứa khoảng trắng)',
    example: 'avatars',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[^\s]+$/)
  folder?: string;

  @ApiProperty({
    description: 'Tên file tùy chỉnh (tùy chọn, không chứa khoảng trắng)',
    example: 'my-custom-filename',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[^\s]+$/)
  customFileName?: string;
}
