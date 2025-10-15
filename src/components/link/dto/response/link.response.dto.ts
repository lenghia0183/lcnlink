import { Expose, Type } from 'class-transformer';

export class ReferrerInfoDto {
  @Expose()
  id: string;

  @Expose()
  referrer: string;

  @Expose()
  alias: string;
}

export class LinkResponseDto {
  @Expose()
  id: string;

  @Expose()
  originalUrl: string;

  @Expose()
  shortedUrl: string;

  @Expose()
  alias: string;

  @Expose()
  description: string;

  @Expose()
  clicksCount: number;

  @Expose()
  successfulAccessCount: number;

  @Expose()
  maxClicks: number;

  @Expose()
  expireAt: Date;

  @Expose()
  isUsePassword: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  status: number;

  @Expose()
  referrerId: string | null;

  @Expose()
  @Type(() => ReferrerInfoDto)
  referrer: ReferrerInfoDto | null;
}
