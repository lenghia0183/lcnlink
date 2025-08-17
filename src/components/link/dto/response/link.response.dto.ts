import { Expose } from 'class-transformer';

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
  clicksCount: number;

  @Expose()
  successfulAccessCount: number;

  @Expose()
  maxClicks: number;

  @Expose()
  isActive: boolean;

  @Expose()
  expireAt: Date;

  @Expose()
  createdAt: Date;
}
