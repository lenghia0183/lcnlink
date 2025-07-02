import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Login2FARequiredResponseDTO extends BaseDto<Login2FARequiredResponseDTO> {
  @ApiProperty({
    description: 'Indicates that 2FA is required for this user',
    example: true,
  })
  @Expose()
  requires2FA: boolean;

  @ApiProperty({
    description: 'User email for reference',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'OTP token for verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  otpToken: string;

  @ApiProperty({
    description: 'Message indicating user needs to provide OTP',
    example: 'Please provide your 2FA code to complete login',
  })
  @Expose()
  message: string;
}
