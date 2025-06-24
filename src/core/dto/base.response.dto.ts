import { Expose, Transform, TransformFnParams } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty()
  @Expose({ name: '_id' })
  @Transform(({ obj }: TransformFnParams): string => {
    if (
      typeof obj === 'object' &&
      obj !== null &&
      '_id' in obj &&
      typeof (obj as { _id?: { toString?: () => string } })._id?.toString ===
        'function'
    ) {
      return (obj as { _id: { toString: () => string } })._id.toString();
    }

    return (obj as { id: string }).id;
  })
  id: string;

  @ApiProperty()
  @Expose({ name: 'code' })
  code: string;

  @ApiProperty()
  @Expose({ name: 'name' })
  name: string;

  @ApiProperty()
  @Expose({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty()
  @Expose({ name: 'updatedAt' })
  updatedAt: Date;
}

export class BaseSqlResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @ApiPropertyOptional()
  @Expose()
  code?: string;
}
