import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDto extends BaseDto<RefreshTokenRequestDto> {
  @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOi...' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
