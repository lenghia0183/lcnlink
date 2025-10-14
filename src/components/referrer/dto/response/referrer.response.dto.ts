import { Expose } from 'class-transformer';

export class ReferrerResponseDto {
  @Expose()
  id: string;

  @Expose()
  referrer: string;

  @Expose()
  alias: string;

  @Expose()
  userId: string | null;

  @Expose()
  createdAt: Date;
}
