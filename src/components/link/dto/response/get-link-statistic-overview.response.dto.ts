import { Expose } from 'class-transformer';

export class GetLinkStatisticOverviewResponseDto {
  @Expose()
  totalLink: number;
  @Expose()
  totalClicks: number;
  @Expose()
  totalProtectedLink: number;
  @Expose()
  totalLimitedLink: number;
}
