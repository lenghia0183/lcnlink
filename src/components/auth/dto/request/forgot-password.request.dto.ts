import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class ForgotPasswordRequestDto extends BaseDto<ForgotPasswordRequestDto> {
  @ApiProperty({
    description: 'Địa chỉ email để gửi link đặt lại mật khẩu',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
