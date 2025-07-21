import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseDto } from '@core/dto/base.request.dto';

export class DeleteFileResponseDto extends BaseDto<DeleteFileResponseDto> {
  @ApiProperty({
    description: 'Key của file đã xóa',
    example: 'avatars/abc123.jpg',
  })
  @Expose()
  deletedKey: string;
}

export class DeleteMultipleFilesResponseDto extends BaseDto<DeleteMultipleFilesResponseDto> {
  @ApiProperty({
    description: 'Danh sách file đã xóa thành công',
    type: [DeleteFileResponseDto],
  })
  @Expose()
  deletedFiles: DeleteFileResponseDto[];

  @ApiProperty({
    description: 'Tổng số file',
    example: 5,
  })
  @Expose()
  totalFiles: number;

  @ApiProperty({
    description: 'Số file xóa thành công',
    example: 4,
  })
  @Expose()
  successfulDeletes: number;
}
