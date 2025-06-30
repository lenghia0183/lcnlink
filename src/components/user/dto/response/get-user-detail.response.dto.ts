import { Expose } from 'class-transformer';

import { BaseResponseDto } from '@core/dto/base.response.dto';

export class GetUserDetailResponseDto extends BaseResponseDto {
  @Expose()
  fullname: string;

  @Expose()
  email: string;

  @Expose()
  role: number;

  @Expose()
  gender: number;

  @Expose()
  phone: string;

  @Expose()
  avatar: string;

  @Expose()
  twoFactorSecret: string;

  @Expose()
  isEnable2FA: number;

  @Expose()
  isActive: boolean;

  @Expose()
  isLocked: boolean;
}
