import { BaseDto } from '@core/dto/base.request.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPasswordRequestDto extends BaseDto<VerifyPasswordRequestDto> {
  @IsString()
  @IsNotEmpty()
  password: string;
}
