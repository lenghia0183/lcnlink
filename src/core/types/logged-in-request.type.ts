import { Request } from 'express';
import { User } from '@database/entities/user.entity';
import { REQUEST_USER_KEY } from '@constant/app.enum';

export interface LoggedInRequest extends Request {
  userId?: string;
  [REQUEST_USER_KEY]?: User;
  body: Record<string, unknown> & { user?: User; userId?: string };
  params: Record<string, string> & { userId?: string };
  query: Record<string, string | string[] | undefined> & { userId?: string };
}
