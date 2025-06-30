import { User } from '@database/entities/user.entity';
import { ResponsePayload } from '@utils/response-payload';
import { Allow } from 'class-validator';

export class BaseDto<T = unknown> {
  @Allow()
  request: T;

  @Allow()
  responseError?: ResponsePayload<undefined>;

  @Allow()
  userId?: string;

  @Allow()
  lang?: string;

  @Allow()
  user?: User;
}
