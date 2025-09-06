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
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ period: string; count: number }>> {
    const { userId, filter } = params;

    let from: Date | undefined;
    let to: Date | undefined;
    let interval: 'day' | 'week' | 'month' = 'day';

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin(Link, 'link', 'link.id = click.linkId')
      .where('click.deletedAt IS NULL')
      .andWhere('link.deletedAt IS NULL')
      .andWhere('link.userId = :userId', { userId });

    if (Array.isArray(filter)) {
      filter.forEach((item, index) => {
        if (!item || !item.column || !item.text) return;
        const paramKey = `f_${index}`;

        switch (item.column) {
          case 'from':
            from = new Date(item.text);
            break;
          case 'to':
            to = new Date(item.text);
            break;
          case 'interval':
            if (['day', 'week', 'month'].includes(item.text)) {
              interval = item.text as 'day' | 'week' | 'month';
            }
            break;
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
        }
      });
    }

    if (from) qb.andWhere('click.createdAt >= :from', { from });
    if (to) qb.andWhere('click.createdAt <= :to', { to });

    let dateTrunc: string;
    switch (interval as 'day' | 'week' | 'month') {
      case 'month':
        dateTrunc = 'month';
        break;
      case 'week':
        dateTrunc = 'week';
        break;
      case 'day':
      default:
        dateTrunc = 'day';
    }

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
  }): Promise<Array<{ country: string; count: number; percentage: number }>> {
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
      .addSelect(
        `ROUND((COUNT(click.id)::decimal * 100.0 / SUM(COUNT(click.id)) OVER ()), 2)`,
        'percentage',
      )
      .groupBy('country')
      .orderBy('count', 'DESC')
      .limit(10);

    const rows = await qb.getRawMany<{
      country: string;
      count: string;
      percentage: string;
    }>();

    return rows.map((r) => ({
      country: r.country,
      count: Number(r.count),
      percentage: Number(r.percentage),
    }));
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
      .addSelect(
        `ROUND( (COUNT(click.id)::decimal * 100.0 / SUM(COUNT(click.id)) OVER ()), 2 )`,
        'percentage',
      )
      .groupBy('device')
      .orderBy('count', 'DESC');

    const rows = await qb.getRawMany<{
      device: string;
      count: string;
      percentage: string;
    }>();

    return rows.map((r) => ({
      device: r.device,
      count: Number(r.count),
      percentage: Number(r.percentage),
    }));
  }

  async getBrowserBreakdown(params: {
    userId: string;
    filter?: Array<{ column: string; text: string }>;
  }): Promise<Array<{ browser: string; count: number; percentage: number }>> {
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
      .addSelect(
        `ROUND((COUNT(click.id)::decimal * 100.0 / SUM(COUNT(click.id)) OVER ()), 2)`,
        'percentage',
      )
      .groupBy('browser')
      .orderBy('count', 'DESC');

    const rows = await qb.getRawMany<{
      browser: string;
      count: string;
      percentage: string;
    }>();

    return rows.map((r) => ({
      browser: r.browser,
      count: Number(r.count),
      percentage: Number(r.percentage),
    }));
  }
}
