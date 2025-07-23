/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipeOptions,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { DEFAULT_LANG } from '@constant/app.enum';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { ApiError } from '@utils/api.error';

import { validationPatternMap } from '@core/types/validation-pattern-map.type';

import validationPatterns from './validation-patterns';
import { I18nValidationKeys } from '@constant/i18n-keys.enum';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  constructor(
    private readonly i18n: I18nService,
    private readonly options: ValidationPipeOptions = {},
  ) {
    this.initValidationPatterns();
  }

  private initValidationPatterns(): void {
    for (const [key, pattern] of Object.entries(validationPatterns)) {
      validationPatternMap.set(
        key,
        new RegExp(pattern.replace('$', '\\$'), 'g'),
      );
    }
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    console.log('value', value);
    const validationOptions = { ...this.options };
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    if (!value) {
      throw new BadRequestException('No data submitted');
    }

    try {
      const object = plainToInstance(metatype, value, {
        enableImplicitConversion:
          this.options.transformOptions?.enableImplicitConversion ?? true,
      });

      const errors = await validate(object, validationOptions);

      if (errors.length > 0) {
        const message = await this.getMessage(errors, value?.lang);
        return {
          request: object || {},
          responseError: new ApiError(
            ResponseCodeEnum.BAD_REQUEST,
            message,
          ).toResponse(),
        };
      }

      return {
        request: object || {},
        responseError: undefined,
      };
    } catch (transformError) {
      return this.handleTransformError(transformError, value);
    }
  }

  private handleTransformError(error: unknown, value: any) {
    let errorMessage = '';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const lang = value?.lang || DEFAULT_LANG;

      if (message.includes('filter')) {
        errorMessage = this.i18n.translate(
          I18nValidationKeys.INVALID_FILTER_FORMAT,
          {
            lang,
          },
        );
      } else if (message.includes('sort')) {
        errorMessage = this.i18n.translate(
          I18nValidationKeys.INVALID_SORT_FORMAT,
          {
            lang,
          },
        );
      } else {
        errorMessage = this.i18n.translate(
          I18nValidationKeys.INVALID_DATA_FORMAT,
          {
            lang,
          },
        );
      }
    }

    return {
      request: {},
      responseError: new ApiError(
        ResponseCodeEnum.BAD_REQUEST,
        errorMessage,
      ).toResponse(),
    };
  }

  private toValidate(metatype: any): boolean {
    const primitiveTypes = [String, Boolean, Number, Array, Object];
    return !primitiveTypes.some((type) => metatype === type);
  }

  private async getMessage(
    errors: ValidationError[],
    lang: string,
  ): Promise<string> {
    const error = errors[0];
    if (!error) return 'Unknown error';

    if (!error.children || !error.children.length) {
      return this.extractErrorMessage(error, lang);
    }

    return this.getMessage(error.children, lang);
  }

  private extractErrorMessage(error: ValidationError, lang: string): string {
    const firstConstraintKey = Object.keys(error.constraints || {})[0];
    const firstConstraintsValue = Object.values(error.constraints || {})[0];

    let constraint: string;
    let property: string;

    if (firstConstraintKey === 'whitelistValidation') {
      constraint = firstConstraintsValue;
      property = error.property;
    } else {
      constraint =
        firstConstraintsValue?.replace(error.property, `{property}`) || '';
      property = this.i18n.translate(`property.${error.property}`);
    }

    let patternKey = '';
    let matchResult: RegExpExecArray | null = null;

    for (const [key, regex] of validationPatternMap.entries()) {
      regex.lastIndex = 0;
      const match = regex.exec(constraint);
      if (match) {
        patternKey = key;
        matchResult = match;
        break;
      }
    }

    const replacements = { property };

    if (matchResult) {
      for (let i = 1; i < matchResult.length; i++) {
        replacements[`constraint${i}`] = matchResult[i];
      }
    }

    this.i18n.refresh();

    return patternKey
      ? this.i18n.translate(`validation.${patternKey}`, {
          lang: lang || DEFAULT_LANG,
          args: replacements,
        })
      : this.i18n.translate(
          `validation.${firstConstraintsValue || 'unknown'}`,
          {
            lang: lang || DEFAULT_LANG,
            args: replacements,
          },
        );
  }
}
