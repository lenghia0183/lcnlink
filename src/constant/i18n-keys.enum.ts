/**
 * Translation keys constants for i18n
 * This enum provides IntelliSense support for translation keys
 */
export enum I18nErrorKeys {
  // Authentication & Authorization
  UNAUTHORIZED = 'error.UNAUTHORIZED',
  FORBIDDEN = 'error.FORBIDDEN',
  EMAIL_EXIST = 'error.EMAIL_EXIST',
  EMAIL_OR_PASSWORD_INVALID = 'error.EMAIL_OR_PASSWORD_INVALID',
  ACCOUNT_IS_LOCKED = 'error.ACCOUNT_IS_LOCKED',
  TOKEN_INVALID = 'error.TOKEN_INVALID',
  TOKEN_EXPIRED = 'error.TOKEN_EXPIRED',

  // OTP & 2FA
  OTP_INVALID = 'error.OTP_INVALID',
  OTP_EXPIRED = 'error.OTP_EXPIRED',
  OTP_TOKEN_INVALID = 'error.OTP_TOKEN_INVALID',
  OTP_TOKEN_EXPIRED = 'error.OTP_TOKEN_EXPIRED',
  TWO_FA_ALREADY_SET = 'error.TWO_FA_ALREADY_SET',
  TWO_FA_SECRET_NOT_SET = 'error.TWO_FA_SECRET_NOT_SET',

  // General
  NOT_FOUND = 'error.NOT_FOUND',
  BAD_REQUEST = 'error.BAD_REQUEST',
  STATUS_INVALID = 'error.STATUS_INVALID',
  OLD_PASSWORD_INVALID = 'error.OLD_PASSWORD_INVALID',
  TOO_MANY_REQUEST = 'error.TOO_MANY_REQUEST',

  // File Upload
  UPLOAD_FAILED = 'error.UPLOAD_FAILED',
  FILE_TYPE_INVALID = 'error.FILE_TYPE_INVALID',
  FILE_SIZE_INVALID = 'error.FILE_SIZE_INVALID',
  DELETE_FAILED = 'error.DELETE_FAILED',
  FILE_IS_REQUIRED = 'error.FILE_IS_REQUIRED',
  FILE_MAXIMUM_QUANTITY = 'error.FILE_MAXIMUM_QUANTITY',

  // Captcha
  VALIDATE_CAPTCHA_FAILED = 'error.VALIDATE_CAPTCHA_FAILED',
  CAPTCHA_INVALID = 'error.CAPTCHA_INVALID',

  // Email
  EMAIL_NOT_EXIST = 'error.EMAIL_NOT_EXIST',

  // Password Reset
  RESET_TOKEN_INVALID = 'error.RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED = 'error.RESET_TOKEN_EXPIRED',
  PASSWORD_CONFIRM_NOT_MATCH = 'error.PASSWORD_CONFIRM_NOT_MATCH',

  // Data Export
  NO_DATA_RECORDS = 'error.NO_DATA_RECORDS',
}

export enum I18nMessageKeys {
  // General Messages
  HELLO_WORLD = 'message.HELLO_WORLD',
  SUCCESS = 'message.SUCCESS',

  // CRUD Operations
  CREATE_SUCCESS = 'message.CREATE_SUCCESS',
  UPDATE_SUCCESS = 'message.UPDATE_SUCCESS',
  DELETE_SUCCESS = 'message.DELETE_SUCCESS',

  // Authentication
  REGISTER_SUCCESS = 'message.REGISTER_SUCCESS',
  LOGIN_SUCCESS = 'message.LOGIN_SUCCESS',
  CHANGE_PASSWORD_SUCCESS = 'message.CHANGE_PASSWORD_SUCCESS',

  // Password Reset
  FORGOT_PASSWORD_EMAIL_SENT = 'message.FORGOT_PASSWORD_EMAIL_SENT',
  RESET_PASSWORD_SUCCESS = 'message.RESET_PASSWORD_SUCCESS',

  // Account Status
  UNLOCK_SUCCESS = 'message.UNLOCK_SUCCESS',
  LOCK_SUCCESS = 'message.LOCK_SUCCESS',

  // HTTP Status Messages
  CONTINUE = 'message.CONTINUE',
  SWITCHING_PROTOCOLS = 'message.SWITCHING_PROTOCOLS',
  PROCESSING = 'message.PROCESSING',
  EARLY_HINTS = 'message.EARLY_HINTS',
  CREATED = 'message.CREATED',
  ACCEPTED = 'message.ACCEPTED',
  NON_AUTHORITATIVE_INFORMATION = 'message.NON_AUTHORITATIVE_INFORMATION',
  NO_CONTENT = 'message.NO_CONTENT',
  TOO_MANY_REQUESTS = 'message.TOO_MANY_REQUESTS',
  UNKNOWN_ERROR = 'message.UNKNOWN_ERROR',

  // 2FA
  ENABLE_2FA_SUCCESS = 'message.ENABLE_2FA_SUCCESS',
  DISABLE_2FA_SUCCESS = 'message.DISABLE_2FA_SUCCESS',
  GENERATE_2FA_SECRET_SUCCESS = 'message.GENERATE_2FA_SECRET_SUCCESS',
  CHANGE_2FA_SECRET_SUCCESS = 'message.CHANGE_2FA_SECRET_SUCCESS',
  OTP_REQUIRED = 'message.OTP_REQUIRED',
  OTP_VERIFICATION_SUCCESS = 'message.OTP_VERIFICATION_SUCCESS',

  // File Upload
  UPLOAD_SUCCESS = 'message.UPLOAD_SUCCESS',
}

export enum I18nValidationKeys {
  // Format validation
  INVALID_FILTER_FORMAT = 'validation.INVALID_FILTER_FORMAT',
  INVALID_SORT_FORMAT = 'validation.INVALID_SORT_FORMAT',
  INVALID_DATA_FORMAT = 'validation.INVALID_DATA_FORMAT',

  // Common validation patterns
  IS_DECIMAL = 'validation.IS_DECIMAL',
  IS_BOOLEAN = 'validation.IS_BOOLEAN',
  IS_DATE = 'validation.IS_DATE',
  IS_EMAIL = 'validation.IS_EMAIL',
  IS_NOT_EMPTY = 'validation.IS_NOT_EMPTY',
  IS_STRING = 'validation.IS_STRING',
  IS_NUMBER = 'validation.IS_NUMBER',

  // Password validation
  PASSWORD_MIN_LENGTH = 'validation.PASSWORD_MIN_LENGTH',
  PASSWORD_MATCHES = 'validation.PASSWORD_MATCHES',
}

export enum I18nMailKeys {
  // Password Reset Email
  RESET_PASSWORD_SUBJECT = 'mail.RESET_PASSWORD_SUBJECT',
  RESET_PASSWORD_EXPIRATION = 'mail.RESET_PASSWORD_EXPIRATION',
  RESET_PASSWORD_GREETING = 'mail.RESET_PASSWORD_GREETING',
  RESET_PASSWORD_MESSAGE = 'mail.RESET_PASSWORD_MESSAGE',
  RESET_PASSWORD_BUTTON = 'mail.RESET_PASSWORD_BUTTON',
  RESET_PASSWORD_EXPIRY_NOTE = 'mail.RESET_PASSWORD_EXPIRY_NOTE',
  RESET_PASSWORD_IGNORE = 'mail.RESET_PASSWORD_IGNORE',

  // Password Reset Success Email
  RESET_PASSWORD_SUCCESS_SUBJECT = 'mail.RESET_PASSWORD_SUCCESS_SUBJECT',
  RESET_PASSWORD_SUCCESS_MESSAGE = 'mail.RESET_PASSWORD_SUCCESS_MESSAGE',
  RESET_PASSWORD_SUCCESS_LOGIN = 'mail.RESET_PASSWORD_SUCCESS_LOGIN',
  RESET_PASSWORD_SUCCESS_SECURITY = 'mail.RESET_PASSWORD_SUCCESS_SECURITY',
}
