import { Expose } from 'class-transformer';
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

  @Expose()
  percentage: number;
}

export class DeviceCountDto {
  @Expose()
  device: string;

  @Expose()
  count: number;

  @Expose()
  percentage: number;
}

export class BrowserCountDto {
  @Expose()
  browser: string;

  @Expose()
  count: number;

  @Expose()
  percentage: number;
}

export class CombinedAnalyticsResponseDto {
  @Expose()
  trend: TrendPointDto[];

  @Expose()
  countries: CountryCountDto[];

  @Expose()
  devices: DeviceCountDto[];

  @Expose()
  browsers: BrowserCountDto[];
}
