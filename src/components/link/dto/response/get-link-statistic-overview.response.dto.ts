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

export class TrendPointDto {
  @Expose()
  period: string;
  @Expose()
  count: number;
}

export class CountryCountDto {
  @Expose()
  country: string;
  @Expose()
  count: number;
}

export class DeviceCountDto {
  @Expose()
  device: string;
  @Expose()
  count: number;
}

export class BrowserCountDto {
  @Expose()
  browser: string;
  @Expose()
  count: number;
}

// end
