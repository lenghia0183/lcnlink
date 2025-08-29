import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class ChangePasswordRequestDto extends BaseDto<ChangePasswordRequestDto> {
  @ApiProperty({
    description: 'Mật khẩu mới cho tài khoản',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
