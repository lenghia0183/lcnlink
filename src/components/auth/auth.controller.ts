import { Public } from '@core/decorators/public.decorator';
import { Body, Controller, Get, Post, Put, Request } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { isEmpty } from 'lodash';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';

import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { Change2FaDto } from './dto/request/change-2fa.request.dto';
import { LoggedInRequest } from '@core/types/logged-in-request.type';
import { Login2FaRequestDto } from './dto/request/verify-otp.request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Public()
  @Post('/register')
  async register(@Body() payload: RegisterRequestDTO) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.register(request);
  }
  @Public()
  @Post('/login')
  async login(@Body() payload: LoginRequestDto) {
    console.log('payload', payload);
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.login(request);
  }

  @Public()
  @Post('/login-2fa')
  async login2fa(@Body() payload: Login2FaRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.login2fa(request);
  }

  @Put('/toggle-2fa')
  async toggle2fa(@Body() payload: Toggle2faRequestDto) {
    const { request, responseError } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.authService.toggle2fa(request);
  }

  @Get('/generate-2fa')
  async generate2fa(@Request() loggedInRequest: LoggedInRequest) {
    const user = loggedInRequest.user;

    if (!user) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST, true)
        .build();
    }

    return await this.authService.generate2fa(user);
  }

  @Put('/change-2fa')
  async change2fa(@Body() payload: Change2FaDto) {
    const { request, responseError } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.change2fa(request);
  }
}
