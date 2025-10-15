import { Referrer } from '@database/entities/referrer.entity';
import { BaseRepositoryInterface } from '../../../core/repository/base-repository.interface';

export interface ReferrerRepositoryInterface
  extends BaseRepositoryInterface<Referrer> {
  findById(id: string): Promise<Referrer | null>;
  findByReferrer(referrer: string): Promise<Referrer | null>;
  findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Referrer[]; total: number }>;
  findByReferrerAndUser(
    referrer: string,
    userId: string,
  ): Promise<Referrer | null>;
}
