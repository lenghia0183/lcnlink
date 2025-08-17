import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
