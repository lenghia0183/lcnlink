import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@core/dto/base.request.dto';

export class Generate2FAResponseDto extends BaseDto<Generate2FAResponseDto> {
  @ApiProperty({
    description: 'Secret key để thiết lập thủ công',
    example: 'NEZC RHF5 KOX4 SE5O G6ER VSWB I2MP GYB5',
  })
  @Expose()
  secret: string;

  @ApiProperty({
    description: 'Mã QR để quét bằng ứng dụng authenticator',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @Expose()
  qrCodeUrl: string;

  @ApiProperty({
    description: 'URL để thiết lập authenticator',
    example: 'otpauth://totp/LCNLink:user@example.com?secret=NEZC...',
  })
  @Expose()
  uri: string;
}
