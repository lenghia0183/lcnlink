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
}
