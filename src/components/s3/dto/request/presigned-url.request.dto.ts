import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseDto } from '@core/dto/base.request.dto';

export class GetPresignedUrlRequestDto extends BaseDto<GetPresignedUrlRequestDto> {
  @ApiProperty({
    description: 'Key của file trong S3',
    example: 'avatars/abc123.jpg',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Thời gian hết hạn của URL (giây), mặc định 3600 (1 giờ)',
    example: 3600,
    required: false,
    minimum: 1,
    maximum: 604800,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(604800)
  expiresIn?: number = 3600;
}
