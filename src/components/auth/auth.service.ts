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
import { AllConfigType } from '@config/config.type';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDTO } from './dto/response/login.response.dto';
import { IS_2FA_ENUM, USER_ROLE_ENUM } from '@components/user/user.constant';
import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';

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

  async toggle2Fa(data: Toggle2faRequestDto) {
    const user = await this.userService.getUserById(data.id);

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
}
