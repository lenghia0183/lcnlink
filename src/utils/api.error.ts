import { ResponseBuilder } from '@utils/response-builder';
import { ResponsePayload } from '@utils/response-payload';
import { getMessage, ResponseCodeEnum } from '@constant/response-code.enum';
import { ResponseMessageUtil } from '@utils/response-message.util';
import { I18nService } from 'nestjs-i18n';

export class ApiError extends Error {
  private readonly _errorCode: ResponseCodeEnum;

  private readonly _message: string;

  constructor(errorCode: ResponseCodeEnum, message?: string) {
    super(message);

    this._errorCode = errorCode;
    this._message = message ?? '';
  }

  get errorCode(): ResponseCodeEnum {
    return this._errorCode;
  }

  get message(): string {
    return this._message || getMessage(this._errorCode);
  }

  toResponse(): ResponsePayload<undefined> {
    return new ResponseBuilder<undefined>()
      .withCode(this._errorCode)
      .withMessage(this.message)
      .build();
  }

  async toResponseI18n(
    i18nService: I18nService,
    lang?: string,
  ): Promise<ResponsePayload<undefined>> {
    const message =
      this._message ||
      (await ResponseMessageUtil.getLocalizedMessage(
        i18nService,
        this._errorCode,
        lang,
      ));

    return new ResponseBuilder<undefined>()
      .withCode(this._errorCode)
      .withMessage(message)
      .build();
  }
}
