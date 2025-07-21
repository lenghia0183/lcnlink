import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteFileRequestDto {
  @ApiProperty({
    description: 'Key của file cần xóa trong S3',
    example: 'avatars/abc123.jpg',
  })
  @IsNotEmpty()
  @IsString()
  key: string;
}

export class DeleteMultipleFilesRequestDto {
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
