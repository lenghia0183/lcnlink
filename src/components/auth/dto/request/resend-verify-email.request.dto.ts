import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class ResendVerifyEmailRequestDto extends BaseDto<ResendVerifyEmailRequestDto> {
  @ApiProperty({ description: 'fullname', example: 'nghialc@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
