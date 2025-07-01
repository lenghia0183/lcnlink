import { FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';

/**
 * Base repository interface với các method CRUD cơ bản
 * Sử dụng generic type T để có thể tái sử dụng cho mọi entity
 */
export interface BaseRepositoryInterface<T> {
  /**
   * Tìm tất cả records với options
   */
  findAll(options?: FindManyOptions<T>): Promise<T[]>;

  /**
   * Tìm một record theo ID
   */
  findById(id: string, options?: FindOneOptions<T>): Promise<T | null>;

  /**
   * Tìm một record theo conditions
   */
  findOne(options: FindOneOptions<T>): Promise<T | null>;

  /**
   * Tìm nhiều records theo conditions
   */
  findMany(options: FindManyOptions<T>): Promise<T[]>;

  /**
   * Tạo mới một record
   */
  create(data: DeepPartial<T>): T;

  /**
   * Lưu một record (create hoặc update)
   */
  save(entity: T): Promise<T>;

  /**
   * Lưu nhiều records
   */
  saveMany(entities: T[]): Promise<T[]>;

  /**
   * Cập nhật record theo ID
   */
  update(id: string, data: DeepPartial<T>): Promise<void>;

  /**
   * Cập nhật nhiều records theo conditions
   */
  updateMany(criteria: Partial<T>, data: DeepPartial<T>): Promise<void>;

  /**
   * Xóa record theo ID (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Xóa nhiều records theo conditions (hard delete)
   */
  deleteMany(criteria: Partial<T>): Promise<void>;

  /**
   * Soft delete record theo ID
   */
  softDelete(id: string): Promise<void>;

  /**
   * Soft delete nhiều records theo conditions
   */
  softDeleteMany(criteria: Partial<T>): Promise<void>;

  /**
   * Đếm số lượng records
   */
  count(options?: FindManyOptions<T>): Promise<number>;

  /**
   * Kiểm tra record có tồn tại không
   */
  exists(options: FindOneOptions<T>): Promise<boolean>;
}
