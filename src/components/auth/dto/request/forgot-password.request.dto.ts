import { IsEmail, IsNotEmpty } from 'class-validator';
import { BaseDto } from '@core/dto/base.request.dto';

export class ForgotPasswordRequestDto extends BaseDto<ForgotPasswordRequestDto> {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
