import { Public } from '@core/decorators/public.decorator';
import { Body, Controller, Get, Post, Put, Request } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { isEmpty } from 'lodash';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';

import { AuthenticatedRequest } from '@core/guards/authenticate.guard';
import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';

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
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.login(request);
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
  async generate2fa(@Request() requestCustom: AuthenticatedRequest) {
    const user = requestCustom.user;

    if (!user) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST, true)
        .build();
    }

    return await this.authService.generate2fa(user);
  }
}
