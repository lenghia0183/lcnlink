import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/repository/base.repository.abstract';
import { ReferrerRepositoryInterface } from './referrer-repository.interface';
import { Referrer } from '@database/entities/referrer.entity';

@Injectable()
export class ReferrerRepository
  extends BaseRepository<Referrer>
  implements ReferrerRepositoryInterface
{
  constructor(
    @InjectRepository(Referrer)
    private readonly referrerRepository: Repository<Referrer>,
  ) {
    super(referrerRepository);
  }

  async findByReferrer(referrer: string): Promise<Referrer | null> {
    return this.findOne({ where: { referrer } });
  }

  async findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Referrer[]; total: number }> {
    const queryBuilder = this.referrerRepository.createQueryBuilder('referrer');

    queryBuilder.where('referrer.deletedAt IS NULL');
    queryBuilder.andWhere('referrer.userId = :userId', { userId });

    if (page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    queryBuilder.orderBy('referrer.createdAt', 'DESC');

    const [referrers, total] = await queryBuilder.getManyAndCount();

    return { data: referrers, total };
  }

  async findByReferrerAndUser(
    referrer: string,
    userId: string,
  ): Promise<Referrer | null> {
    return this.findOne({ where: { referrer, userId } });
  }
}
