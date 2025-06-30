import { ErrorMessageEnum } from './error-message.enum';
import { I18nErrorKeys, I18nMessageKeys } from './i18n-keys.enum';

export enum ResponseCodeEnum {
  // 1xx - Informational
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLY_HINTS = 103,

  // 2xx - Successful
  SUCCESS = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,

  // 4xx - Client errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INVALID_STATUS = 405,
  NOT_ACCEPTABLE = 406,
  TOO_MANY_REQUESTS = 429,

  // 5xx - Server errors
  INTERNAL_SERVER_ERROR = 500,

  // Custom business logic errors
  CODE_EXIST = 1001,
}

// Map response codes to i18n keys
const CODE_I18N_KEYS: Record<ResponseCodeEnum, string> = {
  [ResponseCodeEnum.NOT_FOUND]: I18nErrorKeys.NOT_FOUND,
  [ResponseCodeEnum.INTERNAL_SERVER_ERROR]: 'error.INTERNAL_SERVER_ERROR',
  [ResponseCodeEnum.UNAUTHORIZED]: I18nErrorKeys.UNAUTHORIZED,
  [ResponseCodeEnum.FORBIDDEN]: I18nErrorKeys.FORBIDDEN,
  [ResponseCodeEnum.BAD_REQUEST]: I18nErrorKeys.BAD_REQUEST,
  [ResponseCodeEnum.SUCCESS]: I18nMessageKeys.SUCCESS,
  [ResponseCodeEnum.CODE_EXIST]: 'error.CODE_EXIST',
  [ResponseCodeEnum.NOT_ACCEPTABLE]: 'error.NOT_ACCEPTABLE',
  [ResponseCodeEnum.INVALID_STATUS]: I18nErrorKeys.STATUS_INVALID,
  [ResponseCodeEnum.CONTINUE]: I18nMessageKeys.CONTINUE,
  [ResponseCodeEnum.SWITCHING_PROTOCOLS]: I18nMessageKeys.SWITCHING_PROTOCOLS,
  [ResponseCodeEnum.PROCESSING]: I18nMessageKeys.PROCESSING,
  [ResponseCodeEnum.EARLY_HINTS]: I18nMessageKeys.EARLY_HINTS,
  [ResponseCodeEnum.CREATED]: I18nMessageKeys.CREATED,
  [ResponseCodeEnum.ACCEPTED]: I18nMessageKeys.ACCEPTED,
  [ResponseCodeEnum.NON_AUTHORITATIVE_INFORMATION]:
    I18nMessageKeys.NON_AUTHORITATIVE_INFORMATION,
  [ResponseCodeEnum.NO_CONTENT]: I18nMessageKeys.NO_CONTENT,
  [ResponseCodeEnum.TOO_MANY_REQUESTS]: I18nMessageKeys.TOO_MANY_REQUESTS,
};

// Fallback messages for backward compatibility
const CODE_MESSAGES: Record<ResponseCodeEnum, string> = {
  [ResponseCodeEnum.NOT_FOUND]: ErrorMessageEnum.NOT_FOUND,
  [ResponseCodeEnum.INTERNAL_SERVER_ERROR]:
    ErrorMessageEnum.INTERNAL_SERVER_ERROR,
  [ResponseCodeEnum.UNAUTHORIZED]: ErrorMessageEnum.UNAUTHORIZED,
  [ResponseCodeEnum.FORBIDDEN]: ErrorMessageEnum.FORBIDDEN,
  [ResponseCodeEnum.BAD_REQUEST]: ErrorMessageEnum.BAD_REQUEST,
  [ResponseCodeEnum.SUCCESS]: ErrorMessageEnum.SUCCESS,
  [ResponseCodeEnum.CODE_EXIST]: ErrorMessageEnum.CODE_EXIST,
  [ResponseCodeEnum.NOT_ACCEPTABLE]: ErrorMessageEnum.NOT_ACCEPTABLE,
  [ResponseCodeEnum.INVALID_STATUS]: ErrorMessageEnum.INVALID_STATUS,
  // Add default messages for other status codes
  [ResponseCodeEnum.CONTINUE]: 'Continue',
  [ResponseCodeEnum.SWITCHING_PROTOCOLS]: 'Switching Protocols',
  [ResponseCodeEnum.PROCESSING]: 'Processing',
  [ResponseCodeEnum.EARLY_HINTS]: 'Early Hints',
  [ResponseCodeEnum.CREATED]: 'Created',
  [ResponseCodeEnum.ACCEPTED]: 'Accepted',
  [ResponseCodeEnum.NON_AUTHORITATIVE_INFORMATION]:
    'Non-Authoritative Information',
  [ResponseCodeEnum.NO_CONTENT]: 'No Content',
  [ResponseCodeEnum.TOO_MANY_REQUESTS]: 'Too Many Requests',
};

// Get i18n key for response code
export const getMessageKey = (code: ResponseCodeEnum): string => {
  return CODE_I18N_KEYS[code] || I18nMessageKeys.UNKNOWN_ERROR;
};

// Backward compatibility - returns hardcoded message
export const getMessage = (code: ResponseCodeEnum): string => {
  return CODE_MESSAGES[code] || 'Unknown Error';
};
