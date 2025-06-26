import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateUserResponseDTo extends BaseDto<CreateUserResponseDTo> {
  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  phone: string;

  @ApiProperty()
  @Expose()
  role: number;

  @ApiProperty()
  @Expose()
  is2FA: number;

  @ApiProperty()
  @Expose()
  isLocked: number;

  @ApiProperty()
  @Expose()
  gender: number;

  @ApiProperty()
  @Expose()
  avatar: string;

  @ApiProperty()
  @Expose()
  twoFactorSecret: string;
}
