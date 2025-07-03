import { BaseRepositoryInterface } from '../../../core/repository/base-repository.interface';
import { User } from '@database/entities/user.entity';

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {
  findByEmail(email: string): Promise<User | null>;

  isEmailExists(email: string): Promise<boolean>;

  updateLockStatus(userId: string, isLocked: boolean): Promise<void>;

  updateActiveStatus(userId: string, isActive: boolean): Promise<void>;

  findWithKeyword(
    keyword: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: User[]; total: number }>;
}
