import { BaseDto } from '@core/dto/base.request.dto';
import { IsOptional, IsInt } from 'class-validator';

export class GetListLinkRequestDto extends BaseDto<GetListLinkRequestDto> {
  @IsOptional()
  keyword?: string;

  @IsOptional()
  filter?: Array<{ column: string; text: string }>;

  @IsOptional()
  sort?: Array<{ column: string; order: string }>;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
