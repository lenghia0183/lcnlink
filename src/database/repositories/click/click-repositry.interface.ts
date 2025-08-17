import { Click } from '@database/entities/click.entity';
import { BaseRepositoryInterface } from '../../../core/repository/base-repository.interface';

export interface ClickRepositoryInterface
  extends BaseRepositoryInterface<Click> {
  findByLinkId(
    linkId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Click[]; total: number }>;
}
