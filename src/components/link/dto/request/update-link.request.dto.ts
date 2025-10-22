import { BaseDto } from '@core/dto/base.request.dto';
import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class UpdateLinkRequestDto extends BaseDto<UpdateLinkRequestDto> {
  @IsOptional()
  @IsString()
  originalUrl?: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;

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
