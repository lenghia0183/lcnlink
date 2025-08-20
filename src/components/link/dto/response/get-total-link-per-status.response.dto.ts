import { LINK_STATUS } from '@components/link/link.constant';
import { Expose } from 'class-transformer';

export class GetTotalLinkPerStatusResponseDto {
  @Expose()
  status: LINK_STATUS;

  @Expose()
  count: number;
}
