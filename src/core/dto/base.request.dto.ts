import { ResponsePayload } from '@utils/response-payload';

export class BaseDto<T = unknown> {
  request: T;

  responseError?: ResponsePayload<undefined>;

  userId?: string;

  lang?: string;
}
