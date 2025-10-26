import { Click } from '@database/entities/click.entity';
import { BaseRepositoryInterface } from '../../../core/repository/base-repository.interface';

export interface ClickRepositoryInterface
  extends BaseRepositoryInterface<Click> {
  findByLinkId(
    linkId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Click[]; total: number }>;

  createClick(data: Partial<Click>): Promise<Click>;

  getClicksTrend(params: {
    userId: string;
    from?: Date;
    to?: Date;
    interval?: 'day' | 'week' | 'month';
    filter?: Array<{ column: string; text: string }>;
  }): Promise<
    Array<{ period: string; totalClick: number; totalClickSuccess: number }>
  >;

  getTopCountries(params: {
    userId: string;
    from?: Date;
    to?: Date;
    limit?: number;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ country: string; count: number }>>;

  getDeviceBreakdown(params: {
    userId: string;
    from?: Date;
    to?: Date;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ device: string; count: number }>>;

  getBrowserBreakdown(params: {
    userId: string;
    from?: Date;
    to?: Date;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ browser: string; count: number }>>;
}
