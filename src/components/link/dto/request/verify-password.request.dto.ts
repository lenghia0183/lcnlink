import { BaseDto } from '@core/dto/base.request.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyPasswordRequestDto extends BaseDto<VerifyPasswordRequestDto> {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  clickId?: string;
}
