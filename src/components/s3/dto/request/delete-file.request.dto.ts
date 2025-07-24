import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteMultipleFilesRequestDto extends BaseDto<DeleteMultipleFilesRequestDto> {
  @ApiProperty({
    description: 'Danh sách key của các file cần xóa trong S3',
    example: ['avatars/abc123.jpg', 'documents/def456.pdf'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keys: string[];
}
