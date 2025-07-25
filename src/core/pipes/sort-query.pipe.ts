/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { isJson } from '@helpers/string.helper';

@Injectable()
export class SortQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const { type } = metadata;
    if (type === 'query') return this.transformQuery(value);

    return value;
  }

  transformQuery(query: any) {
    if (typeof query !== 'object') return query;

    let { sort } = query;
    if (sort) sort = sort.replace(/\\/g, '');

    if (isJson(sort)) {
      const decodedData = decodeURIComponent(sort);
      query.sort = JSON.parse(decodedData);
    }

    return query;
  }
}
