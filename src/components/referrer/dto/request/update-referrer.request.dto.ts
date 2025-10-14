import { BaseDto } from '@core/dto/base.request.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateReferrerDto extends BaseDto<UpdateReferrerDto> {
  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
