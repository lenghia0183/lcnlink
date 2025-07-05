import { BaseRepositoryInterface } from '../../../core/repository/base-repository.interface';
import { User } from '@database/entities/user.entity';

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {
  findByEmail(email: string): Promise<User | null>;

  isEmailExists(email: string): Promise<boolean>;

  updateLockStatus(userId: string, isLocked: number): Promise<void>;

  updateActiveStatus(userId: string, isActive: number): Promise<void>;

  findWithKeyword(
    keyword: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: User[]; total: number }>;

  /**
   * Tìm users với filter, sort và pagination phức tạp
   */
  findUsersWithFilters(params: {
    keyword?: string;
    filter?: Array<{ column: string; text: string }>;
    sort?: Array<{ column: string; order: string }>;
    page?: number;
    limit?: number;
    isExport?: boolean;
  }): Promise<{ data: User[]; total: number }>;
}
