import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../../../core/repository/base.repository.abstract';
import { UserRepositoryInterface } from './user-repository.interface';
import { User } from '@database/entities/user.entity';
import { isEmpty } from 'lodash';
import { getPostgresLikePattern, EnumSort } from '@utils/common';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements UserRepositoryInterface
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async isEmailExists(email: string): Promise<boolean> {
    return this.exists({ where: { email } });
  }

  async updateLockStatus(userId: string, isLocked: boolean): Promise<void> {
    await this.update(userId, { isLocked });
  }

  async updateActiveStatus(userId: string, isActive: boolean): Promise<void> {
    await this.update(userId, { isActive });
  }

  /**
   * Tạo QueryBuilder để sử dụng trong service
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<User> {
    return this.userRepository.createQueryBuilder(alias);
  }

  async findWithKeyword(
    keyword: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: User[]; total: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Add where condition for soft delete
    queryBuilder.where('user.deletedAt IS NULL');

    // Add keyword search
    if (keyword && keyword.trim()) {
      queryBuilder.andWhere(
        '(user.email ILIKE :keyword OR user.fullname ILIKE :keyword)',
        { keyword: `%${keyword.trim()}%` },
      );
    }

    // Add pagination
    if (page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    // Add default sorting
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return { data: users, total };
  }

  /**
   * Tìm users với filter, sort và pagination phức tạp
   */
  async findUsersWithFilters(params: {
    keyword?: string;
    filter?: Array<{ column: string; text: string }>;
    sort?: Array<{ column: string; order: string }>;
    page?: number;
    limit?: number;
    isExport?: boolean;
  }): Promise<{ data: User[]; total: number }> {
    const { keyword, filter, sort, page, limit, isExport } = params;

    const queryBuilder: SelectQueryBuilder<User> =
      this.createQueryBuilder('user');

    queryBuilder.where('user.deletedAt IS NULL');

    if (!isEmpty(keyword)) {
      queryBuilder.andWhere(
        '(user.email ILIKE :keyword OR user.fullname ILIKE :keyword OR user.phone ILIKE :keyword)',
        { keyword: getPostgresLikePattern(keyword || '') },
      );
    }

    if (!isEmpty(filter)) {
      filter!.forEach((item, index) => {
        if (!item || !item.text || !item.column) return;

        const value = item.text;
        const paramKey = `filter_${index}`;

        switch (item.column) {
          case 'email':
            queryBuilder.andWhere(`user.email ILIKE :${paramKey}`, {
              [paramKey]: getPostgresLikePattern(value),
            });
            break;

          case 'fullname':
            queryBuilder.andWhere(`user.fullname ILIKE :${paramKey}`, {
              [paramKey]: getPostgresLikePattern(value),
            });
            break;

          case 'phone':
            queryBuilder.andWhere(`user.phone ILIKE :${paramKey}`, {
              [paramKey]: getPostgresLikePattern(value),
            });
            break;

          case 'isLocked': {
            const lockedValues = value
              .split(',')
              .map((item) => Number(item.trim()));
            queryBuilder.andWhere(`user.isLocked IN (:...${paramKey})`, {
              [paramKey]: lockedValues,
            });
            break;
          }

          case 'gender': {
            const genderValues = value
              .split(',')
              .map((item) => Number(item.trim()));
            queryBuilder.andWhere(`user.gender IN (:...${paramKey})`, {
              [paramKey]: genderValues,
            });
            break;
          }

          case 'role':
            queryBuilder.andWhere(`user.role = :${paramKey}`, {
              [paramKey]: Number(value),
            });
            break;

          case 'roles': {
            const roleValues = value
              .split(',')
              .map((item) => Number(item.trim()));
            queryBuilder.andWhere(`user.role IN (:...${paramKey})`, {
              [paramKey]: roleValues,
            });
            break;
          }

          case 'createdAt': {
            const [startCreateAt, endCreateAt] = value.split('|');
            queryBuilder.andWhere(
              `user.createdAt BETWEEN :${paramKey}_start AND :${paramKey}_end`,
              {
                [`${paramKey}_start`]: new Date(startCreateAt),
                [`${paramKey}_end`]: new Date(endCreateAt),
              },
            );
            break;
          }

          case 'updatedAt': {
            const [startUpdateAt, endUpdateAt] = value.split('|');
            queryBuilder.andWhere(
              `user.updatedAt BETWEEN :${paramKey}_start AND :${paramKey}_end`,
              {
                [`${paramKey}_start`]: new Date(startUpdateAt),
                [`${paramKey}_end`]: new Date(endUpdateAt),
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
        const order: 'ASC' | 'DESC' =
          item.order?.toUpperCase() === 'ASC' ? EnumSort.ASC : EnumSort.DESC;
        if (index === 0) {
          queryBuilder.orderBy(`user.${item.column}`, order);
        } else {
          queryBuilder.addOrderBy(`user.${item.column}`, order);
        }
      });
    } else {
      queryBuilder.orderBy('user.createdAt', EnumSort.DESC);
    }

    if (!isExport && page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return { data: users, total };
  }
}
