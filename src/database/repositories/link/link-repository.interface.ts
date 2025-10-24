import { Link } from '@database/entities/link.entity';
import { BaseRepositoryInterface } from '../../../core/repository/base-repository.interface';

export interface LinkRepositoryInterface extends BaseRepositoryInterface<Link> {
  findByAlias(alias: string): Promise<Link | null>;

  findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Link[]; total: number }>;

  incrementClicksCount(linkId: string, increment?: number): Promise<void>;

  incrementSuccessfulAccessCount(
    linkId: string,
    increment?: number,
  ): Promise<void>;

  findWithFilters(params: {
    keyword?: string;
    filter?: Array<{ column: string; text: string }>;
    sort?: Array<{ column: string; order: string }>;
    page?: number;
    limit?: number;
    isExport?: boolean;
  }): Promise<{ data: Link[]; total: number }>;

  createLink(data: Partial<Link>): Promise<Link>;

  updateLink(id: string, data: Partial<Link>): Promise<void>;

  deleteLink(id: string): Promise<void>;

  getTotalLinkPerStatus(
    userId: string,
  ): Promise<Record<string, number | string>>;

  getLinkStatisticOverview(
    userId: string,
    linkId?: string,
  ): Promise<Record<string, number | string>>;

  getSingleLinkStatistic(
    userId: string,
    linkId: string,
  ): Promise<{
    totalClicks: number;
    totalUniqueVisitors: number;
    totalSuccessfulAccess: number;
    returningVisitorRate: number;
  }>;
}
