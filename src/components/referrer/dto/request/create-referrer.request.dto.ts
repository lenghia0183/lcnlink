import { BaseDto } from '@core/dto/base.request.dto';
import { IsString, IsOptional } from 'class-validator';

export class CreateReferrerDto extends BaseDto<CreateReferrerDto> {
  @IsString()
  referrer: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
