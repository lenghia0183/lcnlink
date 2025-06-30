import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class Toggle2faRequestDto extends BaseDto<Toggle2faRequestDto> {
  @ApiProperty({ description: 'otp', example: '123456' })
  @IsString()
  @MaxLength(6)
  @IsNotEmpty()
  otp: string;
}
