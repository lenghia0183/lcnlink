import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class ForgotPasswordResponseDto extends BaseDto<ForgotPasswordResponseDto> {
  @ApiProperty({
    description: 'Thông báo thành công khi email đã được gửi',
    example: 'Email đặt lại mật khẩu đã được gửi thành công',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Địa chỉ email nơi link đặt lại được gửi đến',
    example: 'user@example.com',
  })
  @Expose()
  email: string;
}
