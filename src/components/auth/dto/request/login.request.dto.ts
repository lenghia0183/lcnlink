import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginRequestDto extends BaseDto<LoginRequestDto> {
  @ApiProperty({ description: 'fullname', example: 'nghialc@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: 'anhnghia123' })
  @IsNotEmpty()
  password: string;
}
