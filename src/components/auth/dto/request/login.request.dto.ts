import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginRequestDto extends BaseDto<LoginRequestDto> {
  @ApiProperty({ description: 'fullname', example: 'nghialc@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: 'anhnghia123' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'OTP code for 2FA (required if 2FA is enabled)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp?: string;
}
