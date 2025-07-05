import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsString, IsNotEmpty, Allow } from 'class-validator';

import { EnumSort } from '@utils/common';
import { BaseDto } from './base.request.dto';
import { ValidationHelper } from '@core/helpers/validation.helper';

export class Sort {
  @ApiProperty({
    description: 'Tên cột để sắp xếp',
    example: 'name',
  })
  @IsString()
  @IsNotEmpty()
  column: string;

  @ApiProperty({
    description: 'Thứ tự sắp xếp (ASC hoặc DESC)',
    example: 'ASC',
    enum: EnumSort,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(EnumSort)
  order: string;
}

export class Filter {
  @ApiProperty({
    description: 'Tên cột để lọc',
    example: 'name',
  })
  @IsString()
  @IsNotEmpty()
  column: string;

  @ApiProperty({
    description: 'Giá trị để lọc',
    example: 'john',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class PaginationQuery extends BaseDto<PaginationQuery> {
  @ApiProperty({
    description: 'Số trang (bắt đầu từ 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Allow()
  @Transform(({ value }) => (value ? Number(value) : 1))
  page: number = 1;

  @ApiProperty({
    description: 'Số lượng bản ghi trên mỗi trang',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Allow()
  @Transform(({ value }) => (value ? Number(value) : 10))
  limit: number = 10;

  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'john doe',
    required: false,
  })
  @Allow()
  keyword?: string;

  @ApiProperty({
    description: 'Mảng bộ lọc dưới dạng JSON',
    example: '[{"column":"name","text":"john"}]',
    required: false,
  })
  @Allow()
  @Type(() => Filter)
  @Transform(({ value }) => {
    try {
      return ValidationHelper.validateAndTransformFilter(value);
    } catch {
      throw new Error('Invalid filter format');
    }
  })
  filter?: Filter[];

  @ApiProperty({
    description: 'Mảng sắp xếp dưới dạng JSON',
    example: '[{"column":"name","order":"ASC"}]',
    required: false,
  })
  @Allow()
  @Type(() => Sort)
  @Transform(({ value }) => {
    try {
      return ValidationHelper.validateAndTransformSort(value);
    } catch {
      throw new Error('Invalid sort format');
    }
  })
  sort?: Sort[];

  @Allow()
  @Transform(({ obj }) => {
    const page = obj.page !== undefined ? Number(obj.page) : 1;
    const limit = obj.limit !== undefined ? Number(obj.limit) : 10;
    return (page - 1) * limit;
  })
  skip: number = 0;

  @Allow()
  @Transform(({ obj }) => {
    const limit = obj.limit !== undefined ? Number(obj.limit) : 10;
    return limit;
  })
  take: number = 10;
}
