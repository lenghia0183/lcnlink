import { Expose } from 'class-transformer';

export class UpdateUserResponseDto {
  @Expose()
  id: string;

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

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
