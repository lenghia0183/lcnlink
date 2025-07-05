import { Expose } from 'class-transformer';

export class ForgotPasswordResponseDto {
  @Expose()
  message: string;

  @Expose()
  email: string;
}
