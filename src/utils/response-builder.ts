import { ResponsePayload } from './response-payload';
import { ResponseCodeEnum, getMessage } from '@constant/response-code.enum';
import { ResponseMessageUtil } from './response-message.util';
import { I18nService } from 'nestjs-i18n';

export class ResponseBuilder<T> {
  // Static reference to i18nService that can be set during app initialization
  private static i18nServiceInstance: I18nService | null = null;

  // Method to set the global i18nService instance
  static setI18nService(i18nService: I18nService): void {
    ResponseBuilder.i18nServiceInstance = i18nService;
  }

  // Method to get the global i18nService instance
  private static getI18nService(): I18nService | null {
    return ResponseBuilder.i18nServiceInstance;
  }

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
    lang?: string,
  ): Promise<ResponseBuilder<T>> {
    this.payload.statusCode = code;
    // Use global instance
    const service = ResponseBuilder.getI18nService();
    if (service) {
      this.payload.message = await ResponseMessageUtil.getLocalizedMessage(
        service,
        code,
        lang,
      );
    } else {
      // Fallback to default message if no i18n service is available
      this.payload.message = getMessage(code);
    }
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
