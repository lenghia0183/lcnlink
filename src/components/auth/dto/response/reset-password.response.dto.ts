import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class ResetPasswordResponseDto extends BaseDto<ResetPasswordResponseDto> {
  @ApiProperty({
    description: 'Thông báo kết quả đặt lại mật khẩu',
    example: 'Mật khẩu đã được đặt lại thành công',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Trạng thái thành công của việc đặt lại mật khẩu',
    example: true,
  })
  @Expose()
  success: boolean;
}
