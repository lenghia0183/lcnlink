import { IsNotEmpty, IsString } from 'class-validator';
import { BaseDto } from '@core/dto/base.request.dto';

export class ResetPasswordRequestDto extends BaseDto<ResetPasswordRequestDto> {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
