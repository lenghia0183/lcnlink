import { ErrorCodeEnum, ResponseCodeEnum } from '@constant/response-code.enum';
import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  ValidationError,
} from '@nestjs/common';
import { Request, Response } from 'express';

export class BusinessException extends Error {
  public statusCode: ResponseCodeEnum;
  public errorCode: ErrorCodeEnum;
  constructor(
    message: string,
    statusCode = ResponseCodeEnum.BAD_REQUEST,
    errorCode = ErrorCodeEnum.BUSINESS_ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class ValidationException extends Error {
  public errors: ValidationError[];
  constructor(validationErrors: ValidationError[] = []) {
    super('Validate Failed');
    this.errors = validationErrors;
  }
}

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const { statusCode } = exception;
    console.log(exception);
    const message = exception.message as unknown;
    const errorCode = exception.errorCode as unknown;

    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      response.status(statusCode).send({
        statusCode,
        errorCode,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
