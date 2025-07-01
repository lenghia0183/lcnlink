import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  IsNull,
} from 'typeorm';
import { BaseRepositoryInterface } from './base-repository.interface';
import { BaseModel } from '@core/schema/base.model';

export abstract class BaseRepository<T extends BaseModel>
  implements BaseRepositoryInterface<T>
{
  protected constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    const mergedOptions = this.mergeWithSoftDeleteFilter(options);
    return this.repository.find(mergedOptions);
  }

  async findById(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    const whereCondition = {
      ...options?.where,
      id,
    } as FindOneOptions<T>['where'];
    const mergedOptions = this.mergeWithSoftDeleteFilter({
      ...options,
      where: whereCondition,
    });
    return this.repository.findOne(mergedOptions);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const mergedOptions = this.mergeWithSoftDeleteFilter(options);
    return this.repository.findOne(mergedOptions);
  }

  async findMany(options: FindManyOptions<T>): Promise<T[]> {
    const mergedOptions = this.mergeWithSoftDeleteFilter(options);
    return this.repository.find(mergedOptions);
  }

  create(data: DeepPartial<T>): T {
    return this.repository.create(data);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async saveMany(entities: T[]): Promise<T[]> {
    return this.repository.save(entities);
  }

  async update(id: string, data: DeepPartial<T>): Promise<void> {
    const criteria = { id } as Parameters<Repository<T>['update']>[0];
    await this.repository.update(
      criteria,
      data as Parameters<Repository<T>['update']>[1],
    );
  }

  async updateMany(criteria: Partial<T>, data: DeepPartial<T>): Promise<void> {
    await this.repository.update(
      criteria as Parameters<Repository<T>['update']>[0],
      data as Parameters<Repository<T>['update']>[1],
    );
  }

  async delete(id: string): Promise<void> {
    const criteria = { id } as Parameters<Repository<T>['delete']>[0];
    await this.repository.delete(criteria);
  }

  async deleteMany(criteria: Partial<T>): Promise<void> {
    await this.repository.delete(
      criteria as Parameters<Repository<T>['delete']>[0],
    );
  }

  async softDelete(id: string): Promise<void> {
    const criteria = { id } as Parameters<Repository<T>['softDelete']>[0];
    await this.repository.softDelete(criteria);
  }

  /**
   * Soft delete nhiều records theo conditions
   */
  async softDeleteMany(criteria: Partial<T>): Promise<void> {
    await this.repository.softDelete(
      criteria as Parameters<Repository<T>['softDelete']>[0],
    );
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    const mergedOptions = this.mergeWithSoftDeleteFilter(options);
    return this.repository.count(mergedOptions);
  }

  async exists(options: FindOneOptions<T>): Promise<boolean> {
    const mergedOptions = this.mergeWithSoftDeleteFilter(options);
    const count = await this.repository.count(mergedOptions);
    return count > 0;
  }

  private mergeWithSoftDeleteFilter<
    O extends FindOneOptions<T> | FindManyOptions<T>,
  >(options?: O): O {
    if (!options) {
      return { where: { deletedAt: IsNull() } } as O;
    }

    if (!options.where) {
      return { ...options, where: { deletedAt: IsNull() } } as O;
    }

    // Nếu where là array (cho OR conditions)
    if (Array.isArray(options.where)) {
      return {
        ...options,
        where: options.where.map((condition) => ({
          ...condition,
          deletedAt: IsNull(),
        })),
      } as O;
    }

    // Nếu where là object
    return {
      ...options,
      where: {
        ...options.where,
        deletedAt: IsNull(),
      },
    } as O;
  }
}
