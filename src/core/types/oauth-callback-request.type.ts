import { Request } from 'express';

import { REQUEST_USER_KEY } from '@constant/app.enum';
import { OAuthValidationResult } from '@components/auth/strategies/google.strategy';

export interface OAuthCallbackRequest extends Request {
  [REQUEST_USER_KEY]?: OAuthValidationResult;
}
