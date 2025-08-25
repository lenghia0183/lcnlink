import { Expose } from 'class-transformer';

export class GetTotalLinkPerStatusResponseDto {
  @Expose()
  expired: number;

  @Expose()
  active: number;

  @Expose()
  limit_reached: number;

  @Expose()
  disabled: number;
}
