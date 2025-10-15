import { Expose, Transform } from 'class-transformer';

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

  // ✅ Transform để giữ lại dữ liệu referrer nếu có
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.referrer) return null;
    return {
      id: obj.referrer.id,
      referrer: obj.referrer.referrer,
      alias: obj.referrer.alias,
    };
  })
  referrer: {
    id: string;
    referrer: string;
    alias: string;
  } | null;
}
