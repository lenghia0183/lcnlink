import { I18nService } from 'nestjs-i18n';
import {
  ResponseCodeEnum,
  getMessageKey,
  getMessage,
} from '@constant/response-code.enum';
import { DEFAULT_LANG } from '@constant/app.enum';
import { ResponseBuilder } from './response-builder';

export class ResponseMessageUtil {
  static async getLocalizedMessage(
    i18nService: I18nService | null,
    code: ResponseCodeEnum,
    lang?: string,
  ): Promise<string> {
    try {
      const service = i18nService || ResponseBuilder['getI18nService']();
      if (!service) {
        return getMessage(code);
      }

      const messageKey = getMessageKey(code);
      const translatedMessage = await service.translate(messageKey, {
        lang: lang || DEFAULT_LANG,
      });

      if (translatedMessage === messageKey) {
        return getMessage(code);
      }

      return translatedMessage as string;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return getMessage(code);
    }
  }

  static getMessageKey(code: ResponseCodeEnum): string {
    return getMessageKey(code);
  }
}
