import { Expose } from 'class-transformer';

export class GetSingleLinkStatisticResponseDto {
  @Expose()
  totalClicks: number;

  @Expose()
  totalUniqueVisitors: number;

  @Expose()
  totalSuccessfulAccess: number;

  @Expose()
  returningVisitorRate: number;
}
