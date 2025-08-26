import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Link } from '@database/entities/link.entity';
import { BaseRepository } from '../../../core/repository/base.repository.abstract';
import { ClickRepositoryInterface } from './click-repositry.interface';
import { Click } from '@database/entities/click.entity';

@Injectable()
export class ClickRepository
  extends BaseRepository<Click>
  implements ClickRepositoryInterface
{
  constructor(
    @InjectRepository(Click)
    private readonly clickRepository: Repository<Click>,
  ) {
    super(clickRepository);
  }

  async findByLinkId(
    linkId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Click[]; total: number }> {
    const queryBuilder = this.clickRepository.createQueryBuilder('click');

    queryBuilder.where('click.deletedAt IS NULL');
    queryBuilder.andWhere('click.linkId = :linkId', { linkId });

    if (page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    queryBuilder.orderBy('click.createdAt', 'DESC');

    const [clicks, total] = await queryBuilder.getManyAndCount();

    return { data: clicks, total };
  }

  async createClick(data: DeepPartial<Click>): Promise<Click> {
    const entity = this.create(data);
    return this.save(entity);
  }

  async getClicksTrend(params: {
    userId: string;
    from?: Date;
    to?: Date;
    interval?: 'day' | 'week' | 'month';
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ period: string; count: number }>> {
    const { userId, from, to, interval = 'day', filter } = params;

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.linkId')
      .where('click.deletedAt IS NULL')
      .andWhere('link.deletedAt IS NULL')
      .andWhere('link.userId = :userId', { userId });

    if (from) qb.andWhere('click.createdAt >= :from', { from });
    if (to) qb.andWhere('click.createdAt <= :to', { to });

    if (Array.isArray(filter)) {
      filter.forEach((item, index) => {
        if (!item || !item.column || !item.text) return;
        const paramKey = `f_${index}`;
        switch (item.column) {
          case 'alias':
            qb.andWhere('link.alias ILIKE :' + paramKey, {
              [paramKey]: `%${item.text}%`,
            });
            break;
          case 'status':
            qb.andWhere('link.status IN (:...' + paramKey + ')', {
              [paramKey]: item.text.split(','),
            });
            break;
          case 'createdAt': {
            const [startStr, endStr] = item.text.split('|');
            if (startStr)
              qb.andWhere('click.createdAt >= :start_' + paramKey, {
                ['start_' + paramKey]: new Date(startStr),
              });
            if (endStr)
              qb.andWhere('click.createdAt <= :end_' + paramKey, {
                ['end_' + paramKey]: new Date(endStr),
              });
            break;
          }
          default:
            break;
        }
      });
    }

    // Use DATE_TRUNC compatible with Postgres; for MySQL, adjust accordingly
    const dateTrunc =
      interval === 'month' ? 'month' : interval === 'week' ? 'week' : 'day';

    qb.select(
      `TO_CHAR(DATE_TRUNC('${dateTrunc}', click.createdAt), 'YYYY-MM-DD')`,
      'period',
    )
      .addSelect('COUNT(click.id)', 'count')
      .groupBy(`DATE_TRUNC('${dateTrunc}', click.createdAt)`)
      .orderBy(`DATE_TRUNC('${dateTrunc}', click.createdAt)`, 'ASC');

    const rows = await qb.getRawMany<{ period: string; count: string }>();
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  async getTopCountries(params: {
    userId: string;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ country: string; count: number }>> {
    const { userId, filter } = params;

    let from: string | undefined;
    let to: string | undefined;

    if (Array.isArray(filter)) {
      filter.forEach((item) => {
        if (!item || !item.column || !item.text) return;
        if (item.column === 'from') from = item.text;
        if (item.column === 'to') to = item.text;
      });
    }

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.linkId')
      .where('click.deletedAt IS NULL')
      .andWhere('link.deletedAt IS NULL')
      .andWhere('link.userId = :userId', { userId });

    if (from) qb.andWhere('click.createdAt >= :from', { from });
    if (to) qb.andWhere('click.createdAt <= :to', { to });

    if (Array.isArray(filter)) {
      filter.forEach((item, index) => {
        if (!item || !item.column || !item.text) return;
        const paramKey = `f_${index}`;
        if (item.column === 'alias') {
          qb.andWhere('link.alias ILIKE :' + paramKey, {
            [paramKey]: `%${item.text}%`,
          });
        }
      });
    }

    qb.select('COALESCE(click.country, :unknown)', 'country')
      .setParameter('unknown', 'Unknown')
      .addSelect('COUNT(click.id)', 'count')
      .groupBy('country')
      .orderBy('count', 'DESC')
      .limit(10);

    const rows = await qb.getRawMany<{ country: string; count: string }>();
    console.log('rows', rows);
    return rows.map((r) => ({ country: r.country, count: Number(r.count) }));
  }

  async getDeviceBreakdown(params: {
    userId: string;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ device: string; count: number }>> {
    const { userId, filter } = params;

    let from: string | undefined;
    let to: string | undefined;

    if (Array.isArray(filter)) {
      filter.forEach((item) => {
        if (!item || !item.column || !item.text) return;
        if (item.column === 'from') from = item.text;
        if (item.column === 'to') to = item.text;
      });
    }

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.linkId')
      .where('click.deletedAt IS NULL')
      .andWhere('link.deletedAt IS NULL')
      .andWhere('link.userId = :userId', { userId });

    if (from) qb.andWhere('click.createdAt >= :from', { from });
    if (to) qb.andWhere('click.createdAt <= :to', { to });

    if (Array.isArray(filter)) {
      filter.forEach((item, index) => {
        if (!item || !item.column || !item.text) return;
        const paramKey = `f_${index}`;
        if (item.column === 'alias') {
          qb.andWhere('link.alias ILIKE :' + paramKey, {
            [paramKey]: `%${item.text}%`,
          });
        }
      });
    }

    qb.select('COALESCE(click.device, :unknown)', 'device')
      .setParameter('unknown', 'Unknown')
      .addSelect('COUNT(click.id)', 'count')
      .groupBy('device')
      .orderBy('count', 'DESC');

    const rows = await qb.getRawMany<{ device: string; count: string }>();
    return rows.map((r) => ({ device: r.device, count: Number(r.count) }));
  }

  async getBrowserBreakdown(params: {
    userId: string;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ browser: string; count: number }>> {
    const { userId, filter } = params;
    let from: string | undefined;
    let to: string | undefined;

    if (Array.isArray(filter)) {
      filter.forEach((item) => {
        if (!item || !item.column || !item.text) return;
        if (item.column === 'from') from = item.text;
        if (item.column === 'to') to = item.text;
      });
    }
    const qb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.linkId')
      .where('click.deletedAt IS NULL')
      .andWhere('link.deletedAt IS NULL')
      .andWhere('link.userId = :userId', { userId });

    if (from) qb.andWhere('click.createdAt >= :from', { from });
    if (to) qb.andWhere('click.createdAt <= :to', { to });

    if (Array.isArray(filter)) {
      filter.forEach((item, index) => {
        if (!item || !item.column || !item.text) return;
        const paramKey = `f_${index}`;
        if (item.column === 'alias') {
          qb.andWhere('link.alias ILIKE :' + paramKey, {
            [paramKey]: `%${item.text}%`,
          });
        }
      });
    }

    qb.select('COALESCE(click.browser, :unknown)', 'browser')
      .setParameter('unknown', 'Unknown')
      .addSelect('COUNT(click.id)', 'count')
      .groupBy('browser')
      .orderBy('count', 'DESC');

    const rows = await qb.getRawMany<{ browser: string; count: string }>();
    return rows.map((r) => ({ browser: r.browser, count: Number(r.count) }));
  }
}
