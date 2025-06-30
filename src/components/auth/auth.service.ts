import { Injectable } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { User } from '@database/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as twoFactor from 'node-2fa';
import { plainToInstance } from 'class-transformer';
import { RegisterResponseDTO } from './dto/response/register.response.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { I18nService } from 'nestjs-i18n';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { UserService } from '@components/user/user.service';
import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { LoginRequestDto } from './dto/request/login.request.dto';
import bcrypt from 'bcrypt';
import { AllConfigType, AppConfig } from '@config/config.type';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDTO } from './dto/response/login.response.dto';
import { IS_2FA_ENUM, USER_ROLE_ENUM } from '@components/user/user.constant';
import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';
import { Change2FaDto } from './dto/request/change-2fa.request.dto';
import { Change2faResponseDto } from './dto/response/change-2fa.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService,
    private readonly jwt: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService<AllConfigType>,

    private readonly userService: UserService,
  ) {}
  async register(data: RegisterRequestDTO) {
    const existedUser = await this.userService.getUserByEmail(data.email);

    if (existedUser) {
      throw new BusinessException(
        await this.i18n.translate('error.EMAIL_EXIST'),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const { secret } = twoFactor.generateSecret();

    const user = this.userRepository.create({
      email: data.email,
      fullname: data.fullname,
      password: data.password,
      gender: data.gender,
      phone: data.phone,
      createdBy: data.userId,
      twoFactorSecret: secret,
      role: USER_ROLE_ENUM.USER,
    });

    const savedUser = await this.userRepository.save(user);

    const response = plainToInstance(RegisterResponseDTO, savedUser, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.CREATED)
      .withMessage(await this.i18n.translate('message.REGISTER_SUCCESS'))
      .build();
  }

  async login(data: LoginRequestDto) {
    const existedUser = await this.userService.getUserByEmail(data.email);
    if (!existedUser) {
      throw new BusinessException(
        await this.i18n.translate('error.EMAIL_OR_PASSWORD_INVALID'),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    if (existedUser.isLocked) {
      throw new BusinessException(
        await this.i18n.translate('error.ACCOUNT_IS_LOCKED'),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const isMatch = await bcrypt.compare(data.password, existedUser.password);

    if (!isMatch) {
      throw new BusinessException(
        await this.i18n.translate('error.EMAIL_OR_PASSWORD_INVALID'),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const authConfig = this.configService.get('auth', { infer: true });

    const payload = {
      email: existedUser.email,
      fullname: existedUser.fullname,
      role: existedUser.role,
      id: existedUser.id,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: authConfig?.accessSecret,
      expiresIn: authConfig?.accessExpires,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: authConfig?.refreshSecret,
      expiresIn: authConfig?.refreshExpires,
    });

    await this.userRepository.update({ id: existedUser.id }, { refreshToken });

    const response = plainToInstance(LoginResponseDTO, existedUser, {
      excludeExtraneousValues: true,
    });
    response.refreshToken = refreshToken;
    response.accessToken = accessToken;

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(await this.i18n.translate('message.LOGIN_SUCCESS'))
      .build();
  }

  async toggle2fa(data: Toggle2faRequestDto) {
    const { user } = data;

    await this.verifyOtp2Fa(user?.twoFactorSecret || '', data.otp);

    const isEnable2FA =
      user?.isEnable2FA === IS_2FA_ENUM.DISABLED
        ? IS_2FA_ENUM.ENABLED
        : IS_2FA_ENUM.DISABLED;

    await this.userRepository.update({ id: user?.id }, { isEnable2FA });

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        isEnable2FA === IS_2FA_ENUM.ENABLED
          ? await this.i18n.translate('message.ENABLE_2FA_SUCCESS')
          : await this.i18n.translate('message.DISABLE_2FA_SUCCESS'),
      )
      .build();
  }

  async generate2fa(user: User) {
    const appConfig = this.configService.get<AppConfig>('app')!;

    const { secret, uri, qr } = twoFactor.generateSecret({
      name: appConfig?.appName,
      account: user?.email || '',
    });

    const response = {
      secret,
      qrCodeUrl: qr,
      uri,
    };

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        await this.i18n.translate('message.GENERATE_2FA_SECRET_SUCCESS'),
      )
      .build();
  }

  async change2fa(data: Change2FaDto) {
    const { user } = data;

    await this.verifyOtp2Fa(user?.twoFactorSecret || '', data.otp);

    await this.userRepository.update(
      {
        id: user?.id,
      },
      { twoFactorSecret: data.newTwoFactorSecret },
    );
    const response = plainToInstance(Change2faResponseDto, {
      twoFactorSecret: data.newTwoFactorSecret,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        await this.i18n.translate('message.CHANGE_2FA_SECRET_SUCCESS'),
      );
  }

  private async verifyOtp2Fa(
    twoFactorSecret: string,
    otp: string,
  ): Promise<boolean> {
    const verificationResult = twoFactor.verifyToken(twoFactorSecret, otp);
    if (!verificationResult || verificationResult.delta !== 0) {
      throw new BusinessException(
        await this.i18n.translate('error.OTP_INVALID'),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }
    return true;
  }
}
