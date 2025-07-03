import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/repository/base.repository.abstract';
import { UserRepositoryInterface } from './user-repository.interface';
import { User } from '@database/entities/user.entity';

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
}
