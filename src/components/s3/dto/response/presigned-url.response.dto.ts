import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseDto } from '@core/dto/base.request.dto';

export class PresignedUrlResponseDto extends BaseDto<PresignedUrlResponseDto> {
  @ApiProperty({
    description: 'URL có chữ ký để truy cập file',
    example:
      'https://my-bucket.s3.amazonaws.com/avatars/abc123.jpg?X-Amz-Algorithm=...',
  })
  @Expose()
  presignedUrl: string;

  @ApiProperty({
    description: 'Key của file trong S3',
    example: 'avatars/abc123.jpg',
  })
  @Expose()
  key: string;

  @ApiProperty({
    description: 'Thời gian hết hạn (giây)',
    example: 3600,
  })
  @Expose()
  expiresIn: number;
}
