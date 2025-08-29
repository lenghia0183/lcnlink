import { Public } from '@core/decorators/public.decorator';
import { Body, Controller, Get, Post, Put, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { RegisterResponseDTO } from './dto/response/register.response.dto';
import { LoginResponseDTO } from './dto/response/login.response.dto';
import { Login2FARequiredResponseDTO } from './dto/response/login-2fa-required.response.dto';
import { ForgotPasswordResponseDto } from './dto/response/forgot-password.response.dto';
import { ResetPasswordResponseDto } from './dto/response/reset-password.response.dto';
import { Generate2FAResponseDto } from './dto/response/generate-2fa.response.dto';
import { isEmpty } from 'lodash';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login.request.dto';

import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { Change2FaDto } from './dto/request/change-2fa.request.dto';
import { LoggedInRequest } from '@core/types/logged-in-request.type';
import { Login2FaRequestDto } from './dto/request/verify-otp.request.dto';
import { ForgotPasswordRequestDto } from './dto/request/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';
import { RefreshTokenRequestDto } from './dto/request/refresh-token.request.dto';
import { ThrottleForAuth } from '@core/decorators/throttle-redis.decorator';
import { UserService } from '@components/user/user.service';
import { GetUserDetailResponseDto } from '@components/user/dto/response/get-user-detail.response.dto';
import { UpdateMeRequestDto } from './dto/request/update-me.request.dto';

@ThrottleForAuth()
@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}
  @Public()
  @Post('/register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description:
      'Tạo tài khoản người dùng mới với thông tin cá nhân và xác thực',
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: RegisterResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ hoặc email đã tồn tại',
  })
  @ApiBody({ type: RegisterRequestDTO })
  async register(@Body() payload: RegisterRequestDTO) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.register(request);
  }

  @Public()
  @Post('/login')
  @ApiOperation({
    summary: 'Đăng nhập hệ thống',
    description:
      'Xác thực người dùng và trả về access token. Nếu bật 2FA sẽ yêu cầu OTP',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: LoginResponseDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu xác thực 2FA',
    type: Login2FARequiredResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Email hoặc mật khẩu không chính xác',
  })
  @ApiBody({ type: LoginRequestDto })
  async login(@Body() payload: LoginRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.login(request);
  }

  @Public()
  @Post('/login-2fa')
  @ApiOperation({
    summary: 'Xác thực 2FA để hoàn tất đăng nhập',
    description:
      'Xác minh mã OTP từ ứng dụng authenticator để hoàn tất quá trình đăng nhập',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực 2FA thành công',
    type: LoginResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  @ApiBody({ type: Login2FaRequestDto })
  async login2fa(@Body() payload: Login2FaRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.login2fa(request);
  }

  @Put('/toggle-2fa')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bật/tắt xác thực 2FA',
    description:
      'Kích hoạt hoặc vô hiệu hóa xác thực hai yếu tố cho tài khoản người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái 2FA thành công',
  })
  @ApiBadRequestResponse({
    description: 'Mã OTP không hợp lệ',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiBody({ type: Toggle2faRequestDto })
  async toggle2fa(@Body() payload: Toggle2faRequestDto) {
    const { request, responseError } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.authService.toggle2fa(request);
  }

  @Get('/generate-2fa')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mã QR cho 2FA',
    description: 'Tạo mã QR và secret key để thiết lập xác thực hai yếu tố',
  })
  @ApiResponse({
    status: 200,
    description: 'Tạo mã 2FA thành công',
    type: Generate2FAResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async generate2fa(@Request() loggedInRequest: LoggedInRequest) {
    const user = loggedInRequest.user;

    if (!user) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST, true)
        .build();
    }

    return await this.authService.generate2fa(user);
  }

  @Put('/me')
  async updateMe(
    @Body() payload: UpdateMeRequestDto,
    @Request() loggedInRequest: LoggedInRequest,
  ) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.userService.updateUser(
      loggedInRequest?.userId || '',
      request,
    );
  }

  @Get('/me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin người dùng hiện tại',
    description: 'Trả về chi tiết user đang đăng nhập',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin user thành công',
    type: GetUserDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async getMe(@Request() loggedInRequest: LoggedInRequest) {
    const user = loggedInRequest.user;

    if (!user) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST, true)
        .build();
    }

    return await this.userService.getDetail(user.id);
  }

  @Put('/change-2fa')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Thay đổi secret key 2FA',
    description: 'Cập nhật secret key mới cho xác thực hai yếu tố',
  })
  @ApiResponse({
    status: 200,
    description: 'Thay đổi secret key 2FA thành công',
  })
  @ApiBadRequestResponse({
    description: 'Mã OTP không hợp lệ hoặc secret key không đúng',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiBody({ type: Change2FaDto })
  async change2fa(@Body() payload: Change2FaDto) {
    const { request, responseError } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.change2fa(request);
  }

  @Public()
  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Quên mật khẩu',
    description:
      'Gửi email chứa link reset mật khẩu đến địa chỉ email đã đăng ký',
  })
  @ApiResponse({
    status: 200,
    description: 'Email reset mật khẩu đã được gửi thành công',
    type: ForgotPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email không tồn tại trong hệ thống',
  })
  @ApiBody({ type: ForgotPasswordRequestDto })
  async forgotPassword(@Body() payload: ForgotPasswordRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.forgotPassword(request);
  }

  @Public()
  @Post('/reset-password')
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu mới bằng token được gửi qua email',
  })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiBody({ type: ResetPasswordRequestDto })
  async resetPassword(@Body() payload: ResetPasswordRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.authService.resetPassword(request);
  }

  @Public()
  @Post('/refresh-token')
  @ApiOperation({
    summary: 'Làm mới access token bằng refresh token',
    description:
      'Trả access token mới và refresh token mới khi refresh token hợp lệ',
  })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: LoginResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  @ApiBody({ type: RefreshTokenRequestDto })
  async refreshToken(@Body() payload: RefreshTokenRequestDto) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.authService.refreshToken(request);
  }
}
