import { ResponsePayload } from './response-payload';
import { ResponseCodeEnum, getMessage } from '@constant/response-code.enum';
import { ResponseMessageUtil } from './response-message.util';
import { I18nService } from 'nestjs-i18n';

export class ResponseBuilder<T> {
  private payload: ResponsePayload<T> = {
    statusCode: ResponseCodeEnum.SUCCESS,
  };

  constructor(data?: T) {
    this.payload.data = data;
  }

  withCode(code: ResponseCodeEnum, withMessage = true): ResponseBuilder<T> {
    this.payload.statusCode = code;
    if (withMessage) {
      this.payload.message = getMessage(code);
    }
    return this;
  }

  async withCodeI18n(
    code: ResponseCodeEnum,
    i18nService: I18nService,
    lang?: string,
  ): Promise<ResponseBuilder<T>> {
    this.payload.statusCode = code;
    this.payload.message = await ResponseMessageUtil.getLocalizedMessage(
      i18nService,
      code,
      lang,
    );
    return this;
  }

  withMessage(message: string): ResponseBuilder<T> {
    this.payload.message = message;
    return this;
  }

  withData(data: T): ResponseBuilder<T> {
    this.payload.data = data;
    return this;
  }

  build(): ResponsePayload<T> {
    return this.payload;
  }
}
