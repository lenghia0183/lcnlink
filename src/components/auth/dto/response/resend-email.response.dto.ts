import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class ResendVerifyEmailResponseDto extends BaseDto<ResendVerifyEmailResponseDto> {
  @ApiProperty({
    description: 'Địa chỉ email nơi link đặt lại được gửi đến',
    example: 'user@example.com',
  })
  @Expose()
  email: string;
}
