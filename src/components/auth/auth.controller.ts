import { Public } from '@core/decorators/public.decorator';
import { Body, Controller, Get, Post, Put, Request } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { isEmpty } from 'lodash';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';

import { AuthenticatedRequest } from '@core/guards/authenticate.guard';

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
  async toggle2fa(@Request() requestCustom: AuthenticatedRequest) {
    return await this.authService.toggle2fa(requestCustom?.userId || '');
  }

  @Get('/generate-2fa')
  async generate2fa(@Request() requestCustom: AuthenticatedRequest) {
    return await this.authService.generate2fa(requestCustom?.userId || '');
  }
}
