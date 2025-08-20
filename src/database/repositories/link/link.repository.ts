import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DeepPartial } from 'typeorm';
import { BaseRepository } from '../../../core/repository/base.repository.abstract';
import { LinkRepositoryInterface } from './link-repository.interface';
import { Link } from '@database/entities/link.entity';
import { isEmpty } from 'lodash';
import { getPostgresLikePattern, EnumSort } from '@utils/common';
import { LINK_STATUS } from '@components/link/link.constant';

@Injectable()
export class LinkRepository
  extends BaseRepository<Link>
  implements LinkRepositoryInterface
{
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {
    super(linkRepository);
  }

  async findByAlias(alias: string): Promise<Link | null> {
    return this.findOne({ where: { alias } });
  }

  async findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Link[]; total: number }> {
    const queryBuilder = this.linkRepository.createQueryBuilder('link');

    queryBuilder.where('link.deletedAt IS NULL');
    queryBuilder.andWhere('link.userId = :userId', { userId });

    if (page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    queryBuilder.orderBy('link.createdAt', 'DESC');

    const [links, total] = await queryBuilder.getManyAndCount();

    return { data: links, total };
  }

  async incrementClicksCount(linkId: string, increment = 1): Promise<void> {
    await this.linkRepository.increment(
      { id: linkId },
      'clicksCount',
      increment,
    );
  }

  async incrementSuccessfulAccessCount(
    linkId: string,
    increment = 1,
  ): Promise<void> {
    await this.linkRepository.increment(
      { id: linkId },
      'successfulAccessCount',
      increment,
    );
  }

  async createLink(data: DeepPartial<Link>): Promise<Link> {
    const entity = this.create(data);
    return this.save(entity);
  }

  async updateLink(id: string, data: DeepPartial<Link>): Promise<void> {
    await this.update(id, data);
  }

  async deleteLink(id: string): Promise<void> {
    // use soft delete to keep history; change to hard delete if desired
    await this.softDelete(id);
  }

  async findWithFilters(params: {
    keyword?: string;
    filter?: Array<{ column: string; text: string }>;
    sort?: Array<{ column: string; order: string }>;
    page?: number;
    limit?: number;
    isExport?: boolean;
  }): Promise<{ data: Link[]; total: number }> {
    const { keyword, filter, sort, page, limit, isExport } = params;

    const queryBuilder: SelectQueryBuilder<Link> =
      this.createQueryBuilder('link');

    queryBuilder.where('link.deletedAt IS NULL');

    if (!isEmpty(keyword)) {
      queryBuilder.andWhere(
        '(link.alias ILIKE :keyword OR link.originalUrl ILIKE :keyword)',
        { keyword: getPostgresLikePattern(keyword || '') },
      );
    }

    if (!isEmpty(filter)) {
      filter!.forEach((item, index) => {
        if (!item || !item.text || !item.column) return;

        const value = item.text;
        const paramKey = `filter_${index}`;

        switch (item.column) {
          case 'alias':
            queryBuilder.andWhere(`link.alias ILIKE :${paramKey}`, {
              [paramKey]: getPostgresLikePattern(value),
            });
            break;

          case 'originalUrl':
            queryBuilder.andWhere(`link.originalUrl ILIKE :${paramKey}`, {
              [paramKey]: getPostgresLikePattern(value),
            });
            break;

          case 'userId':
            queryBuilder.andWhere(`link.userId = :${paramKey}`, {
              [paramKey]: value,
            });
            break;

          case 'status': {
            const status = value.toLocaleLowerCase() as LINK_STATUS;
            queryBuilder.andWhere(`link.status = :${paramKey}`, {
              [paramKey]: status,
            });
            break;
          }

          case 'createdAt': {
            const [start, end] = value.split('|');
            queryBuilder.andWhere(
              `link.createdAt BETWEEN :${paramKey}_start AND :${paramKey}_end`,
              {
                [`${paramKey}_start`]: new Date(start),
                [`${paramKey}_end`]: new Date(end),
              },
            );
            break;
          }

          default:
            break;
        }
      });
    }

    if (!isEmpty(sort)) {
      sort!.forEach((item, index) => {
        const orderValue = item.order?.toUpperCase() as EnumSort;
        const order: EnumSort = Object.values(EnumSort).includes(orderValue)
          ? orderValue
          : EnumSort.DESC;
        if (index === 0) {
          queryBuilder.orderBy(`link.${item.column}`, order);
        } else {
          queryBuilder.addOrderBy(`link.${item.column}`, order);
        }
      });
    } else {
      queryBuilder.orderBy('link.createdAt', EnumSort.DESC);
    }

    if (!isExport && page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    const [links, total] = await queryBuilder.getManyAndCount();

    for (const link of links) {
      let newStatus: LINK_STATUS | null = null;

      if (link.expireAt && new Date(link.expireAt) < new Date()) {
        newStatus = LINK_STATUS.EXPIRED;
      } else if (link.maxClicks && link.clicksCount >= link.maxClicks) {
        newStatus = LINK_STATUS.LIMIT_REACHED;
      }

      if (newStatus && link.status !== newStatus) {
        link.status = newStatus;

        await this.createQueryBuilder('link')
          .update(Link)
          .set({ status: newStatus })
          .where('id = :id', { id: link.id })
          .execute();
      }
    }

    return { data: links, total };
  }

  async getTotalLinkPerStatus(
    userId: string,
  ): Promise<Array<{ status: LINK_STATUS; count: number }>> {
    const result = await this.createQueryBuilder('link')
      .select('link.status, COUNT(link.id) AS count')
      .where('link.deletedAt IS NULL')
      .andWhere('link.userId = :userId', { userId })
      .groupBy('link.status')
      .getRawMany<{ status: LINK_STATUS; count: string }>();
    const mappedResult = result.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));

    return Object.values(LINK_STATUS).map((status) => {
      const found = mappedResult.find((r) => r.status === status);
      return {
        status,
        count: found ? found.count : 0,
      };
    });
  }
}
