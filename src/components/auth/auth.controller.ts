import { Public } from '@core/decorators/public.decorator';
import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { isEmpty } from 'lodash';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';

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

  @Put('/toggle-2fa/:id')
  async toggle2fa(@Param() params: Toggle2faRequestDto) {
    const { request, responseError } = params;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.toggle2Fa(request);
  }
}
