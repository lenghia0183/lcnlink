import { BaseDto } from '@core/dto/base.request.dto';
import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateLinkRequestDto extends BaseDto<CreateLinkRequestDto> {
  @IsString()
  originalUrl: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  maxClicks?: number;

  @IsOptional()
  @IsDateString()
  expireAt?: string;

  @IsOptional()
  @IsString()
  referrerId?: string;
}
