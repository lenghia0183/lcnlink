import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { BaseDto } from '@core/dto/base.request.dto';

export class ResetPasswordRequestDto extends BaseDto<ResetPasswordRequestDto> {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ResetPasswordResponseDto {
  @Expose()
  message: string;

  @Expose()
  success: boolean;
}
