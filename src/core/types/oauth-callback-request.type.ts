import { Request } from 'express';

import { REQUEST_USER_KEY } from '@constant/app.enum';

import { ResponsePayload } from '@utils/response-payload';
import { OAuthValidationResponseDto } from '@components/auth/dto/response/validate-oauth.response.dto';

export interface OAuthCallbackRequest extends Request {
  [REQUEST_USER_KEY]?: ResponsePayload<OAuthValidationResponseDto>;
}
