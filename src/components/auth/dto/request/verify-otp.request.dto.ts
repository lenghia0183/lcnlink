import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class Login2FaRequestDto extends BaseDto<Login2FaRequestDto> {
  @ApiProperty({
    description: 'OTP token received from login response',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  otpToken: string;

  @ApiProperty({
    description: 'OTP code from authenticator app',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}
