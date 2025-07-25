import { EnumSort } from '@utils/common';
import { isJson } from '@helpers/string.helper';

export interface FilterItem {
  column: string;
  text: string;
}

export interface SortItem {
  column: string;
  order: string;
}

export class ValidationHelper {
  /**
   * Validate and transform filter value
   */
  static validateAndTransformFilter(value: unknown): FilterItem[] | undefined {
    if (Array.isArray(value)) {
      ValidationHelper.validateFilterArray(value);
      return value as FilterItem[];
    }

    if (!value) return undefined;

    if (typeof value !== 'string') {
      throw new Error('Invalid filter format');
    }

    // Clean escape characters
    const cleaned = value.replace(/\\/g, '');

    if (!isJson(cleaned)) {
      throw new Error('Invalid filter format');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Invalid filter format');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid filter format');
    }

    ValidationHelper.validateFilterArray(parsed);
    return parsed as FilterItem[];
  }

  /**
   * Validate and transform sort value
   */
  static validateAndTransformSort(value: unknown): SortItem[] | undefined {
    if (Array.isArray(value)) {
      ValidationHelper.validateSortArray(value);
      return value as SortItem[];
    }

    if (!value) return undefined;

    if (typeof value !== 'string') {
      throw new Error('Invalid sort format');
    }

    // Clean escape characters
    const cleaned = value.replace(/\\/g, '');

    if (!isJson(cleaned)) {
      throw new Error('Invalid sort format');
    }

    let parsed: unknown;
    try {
      const decodedData = decodeURIComponent(cleaned);
      parsed = JSON.parse(decodedData);
    } catch {
      throw new Error('Invalid sort format');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid sort format');
    }

    ValidationHelper.validateSortArray(parsed);
    return parsed as SortItem[];
  }

  /**
   * Validate filter array structure
   */
  private static validateFilterArray(filterArray: unknown[]): void {
    for (const item of filterArray) {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid filter format');
      }

      const filterItem = item as Record<string, unknown>;

      if (
        !filterItem.column ||
        typeof filterItem.column !== 'string' ||
        filterItem.column.trim() === ''
      ) {
        throw new Error('Invalid filter format');
      }

      if (
        filterItem.text === undefined ||
        filterItem.text === null ||
        typeof filterItem.text !== 'string'
      ) {
        throw new Error('Invalid filter format');
      }

      // Validate column name format (only allow alphanumeric, underscore, dot)
      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(filterItem.column)) {
        throw new Error('Invalid filter format');
      }
    }
  }

  /**
   * Validate sort array structure
   */
  private static validateSortArray(sortArray: unknown[]): void {
    for (const item of sortArray) {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid sort format');
      }

      const sortItem = item as Record<string, unknown>;

      if (
        !sortItem.column ||
        typeof sortItem.column !== 'string' ||
        sortItem.column.trim() === ''
      ) {
        throw new Error('Invalid sort format');
      }

      if (!sortItem.order || typeof sortItem.order !== 'string') {
        throw new Error('Invalid sort format');
      }

      // Validate column name format (only allow alphanumeric, underscore, dot)
      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(sortItem.column)) {
        throw new Error('Invalid sort format');
      }

      // Validate order value
      const validOrders = Object.values(EnumSort);
      const normalizedOrder = sortItem.order.toUpperCase();

      if (!validOrders.includes(normalizedOrder as EnumSort)) {
        throw new Error('Invalid sort format');
      }

      // Normalize order to uppercase
      sortItem.order = normalizedOrder;
    }
  }

  /**
   * Validate allowed columns for filter
   */
  static validateAllowedFilterColumns(
    filterArray: FilterItem[],
    allowedColumns: string[],
  ): void {
    if (!allowedColumns || allowedColumns.length === 0) {
      return; // Skip validation if no allowed columns specified
    }

    for (const item of filterArray) {
      if (!allowedColumns.includes(item.column)) {
        throw new Error(
          `Invalid filter column: ${item.column}. Allowed columns are: ${allowedColumns.join(', ')}`,
        );
      }
    }
  }

  /**
   * Validate allowed columns for sort
   */
  static validateAllowedSortColumns(
    sortArray: SortItem[],
    allowedColumns: string[],
  ): void {
    if (!allowedColumns || allowedColumns.length === 0) {
      return; // Skip validation if no allowed columns specified
    }

    for (const item of sortArray) {
      if (!allowedColumns.includes(item.column)) {
        throw new Error(
          `Invalid sort column: ${item.column}. Allowed columns are: ${allowedColumns.join(', ')}`,
        );
      }
    }
  }
}
