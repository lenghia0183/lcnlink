import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsString, IsNotEmpty, Allow } from 'class-validator';

import { EnumSort } from '@utils/common';
import { BaseDto } from './base.request.dto';
import { ValidationHelper } from '@core/helpers/validation.helper';

export class Sort {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  column: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(EnumSort)
  order: string;
}

export class Filter {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  column: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  text: string;
}

export class PaginationQuery extends BaseDto<PaginationQuery> {
  @Allow()
  @Transform(({ value }) => (value ? Number(value) : 1))
  page: number = 1;

  @Allow()
  @Transform(({ value }) => (value ? Number(value) : 10))
  limit: number = 10;

  @Allow()
  keyword?: string;

  @ApiProperty({
    description: 'Filter array in JSON format',
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
    description: 'Sort array in JSON format',
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
