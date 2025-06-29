import { Public } from '@core/decorators/public.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { isEmpty } from 'lodash';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() payload: RegisterRequestDTO) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.register(request);
  }

  @Post('/login')
  async login(@Body() payload: LoginRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.login(request);
  }
}
