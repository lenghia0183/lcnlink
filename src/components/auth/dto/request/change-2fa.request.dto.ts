import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class Change2FaDto extends BaseDto<Change2FaDto> {
  @ApiProperty({ description: 'otp', example: '123456' })
  @IsString()
  @MaxLength(6)
  @MinLength(6)
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    description: 'new secret key',
    example: 'NEZC RHF5 KOX4 SE5O G6ER VSWB I2MP GYB5',
  })
  @IsString()
  @IsNotEmpty()
  newTwoFactorSecret: string;
}
