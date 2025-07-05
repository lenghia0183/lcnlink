import { IsEmail, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';
import { BaseDto } from '@core/dto/base.request.dto';

export class ForgotPasswordRequestDto extends BaseDto<ForgotPasswordRequestDto> {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordResponseDto {
  @Expose()
  message: string;

  @Expose()
  email: string;
}
