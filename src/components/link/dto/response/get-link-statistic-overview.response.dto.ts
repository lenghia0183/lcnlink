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

  @Expose()
  totalUniqueVisitors: number;

  @Expose()
  totalSuccessfulAccess: number;

  @Expose()
  returningVisitorRate: number;
}
