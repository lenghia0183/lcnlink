import { Expose } from 'class-transformer';

export class ResetPasswordResponseDto {
  @Expose()
  message: string;

  @Expose()
  success: boolean;
}
