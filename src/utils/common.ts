/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { omit, replace } from 'lodash';

export const REGEX_FOR_FILTER =
  /[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ 0-9]/gi;

export const mergePayload = <
  T extends Record<string, any>,
  U extends Record<string, any>,
>(
  param: T,
  body: U,
): T & U => {
  const keys = [...new Set([...Object.keys(param), ...Object.keys(body)])];
  const payload = {} as T & U;

  keys.forEach((key) => {
    if (
      typeof param[key] === 'object' &&
      typeof body[key] === 'object' &&
      param[key] !== null &&
      body[key] !== null &&
      !Array.isArray(param[key]) &&
      !Array.isArray(body[key])
    ) {
      // Merge objects
      payload[key as keyof (T & U)] = {
        ...param[key],
        ...body[key],
      } as (T & U)[keyof (T & U)];
    } else {
      // For non-objects, body takes precedence
      payload[key as keyof (T & U)] = (body[key] ?? param[key]) as (T &
        U)[keyof (T & U)];
    }
  });

  return payload;
};

export const getPayloadFromRequest = <T extends object>(
  input: T,
): Omit<T, 'userId' | 'user' | 'lang' | 'request' | 'responseError'> => {
  return omit(input, [
    'userId',
    'user',
    'lang',
    'request',
    'responseError',
  ]) as Omit<T, 'userId' | 'user' | 'lang' | 'request' | 'responseError'>;
};

export const getValueOrDefault = <T>(value: any, defaultValue: T): T => {
  return value !== null && value !== undefined ? (value as T) : defaultValue;
};

export const isDevMode = () => {
  return (
    process.env.NODE_ENV?.startsWith('dev') ||
    process.env.NODE_ENV?.startsWith('local') ||
    process.env.NODE_ENV?.startsWith('stag')
  );
};

export enum EnumSort {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SortOrder {
  ASC = 1,
  DESC = -1,
}

export const convertOrderMongo = (orderText: string): number => {
  return orderText?.toLowerCase() === 'desc' ? -1 : 1;
};

export const getRegexByValue = (value: string) => {
  return {
    $regex: '.*' + replace(value, REGEX_FOR_FILTER, (e) => `\\${e}`) + '.*',
    $options: 'i',
  };
};

export const getPostgresLikePattern = (value: string): string => {
  if (!value) return '%';

  // Escape các ký tự đặc biệt của PostgreSQL LIKE/ILIKE
  const escaped = value
    .replace(/\\/g, '\\\\') // Escape backslash
    .replace(/%/g, '\\%') // Escape percent
    .replace(/_/g, '\\_'); // Escape underscore

  return `%${escaped}%`;
};
