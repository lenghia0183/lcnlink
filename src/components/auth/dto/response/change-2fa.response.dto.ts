import { BaseResponseDto } from '@core/dto/base.response.dto';
import { Expose } from 'class-transformer';

export class Change2faResponseDto extends BaseResponseDto {
  @Expose()
  twoFactorSecret: string;
}
