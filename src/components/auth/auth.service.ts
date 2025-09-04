import { Injectable } from '@nestjs/common';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { User } from '@database/entities/user.entity';
import { UserRepository } from '@database/repositories/user/user.repository';
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
import { AllConfigType, AppConfig, AuthConfig } from '@config/config.type';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDTO } from './dto/response/login.response.dto';
import { Login2FARequiredResponseDTO } from './dto/response/login-2fa-required.response.dto';
import {
  IS_2FA_ENUM,
  USER_LOCKED_ENUM,
  USER_ROLE_ENUM,
} from '@components/user/user.constant';
import { Toggle2faRequestDto } from './dto/request/toggle-2fa.request.dto';
import { Change2FaDto } from './dto/request/change-2fa.request.dto';
import { Change2faResponseDto } from './dto/response/change-2fa.response.dto';
import { I18nErrorKeys, I18nMessageKeys } from '@constant/i18n-keys.enum';
import { Login2FaRequestDto } from './dto/request/verify-otp.request.dto';
import { OtpTokenPayload } from '@components/types/otp-token-payload.interface';
import { JwtPayload } from '@core/types/jwt-payload.type';
import { ForgotPasswordRequestDto } from './dto/request/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';

import { ForgotPasswordResponseDto } from './dto/response/forgot-password.response.dto';
import { MailService } from '@components/mail/mail.service';

import { ForgotPasswordTokenPayload } from '@components/types/forgot-password-token-payload.interface';
import { ResetPasswordResponseDto } from './dto/response/reset-password.response.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { RedisService } from '@core/services/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  private get2FARedisKey(userId: string): string {
    return `auth:login-2fa-token:${userId}`;
  }

  private getForgotPasswordRedisKey(userId: string): string {
    return `auth:forgot-password-token:${userId}`;
  }

  async register(data: RegisterRequestDTO) {
    const existedUser = await this.userRepository.findByEmail(data.email);

    if (existedUser) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_EXIST),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const { secret, uri, qr } = twoFactor.generateSecret();

    const user = this.userRepository.create({
      email: data.email,
      fullname: data.fullname,
      password: data.password,
      gender: data.gender,
      phone: data.phone,
      createdBy: data.userId,
      twoFactorSecret: secret,
      twoFactorQr: qr,
      twoFactorUri: uri,
      isLocked: USER_LOCKED_ENUM.UNLOCKED,
      role: USER_ROLE_ENUM.USER,
    });

    const savedUser = await this.userRepository.save(user);

    const response = plainToInstance(RegisterResponseDTO, savedUser, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.CREATED)
      .withMessage(await this.i18n.translate(I18nMessageKeys.REGISTER_SUCCESS))
      .build();
  }
  async refreshToken(data: { refreshToken: string }) {
    const authConfig = this.configService.get('auth', { infer: true });

    let payload: JwtPayload | null = null;
    try {
      payload = await this.JwtService.verifyAsync<JwtPayload>(
        data.refreshToken,
        { secret: authConfig?.refreshSecret },
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError') {
          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
            ResponseCodeEnum.UNAUTHORIZED,
          );
        }
        if (error.name === 'TokenExpiredError') {
          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.TOKEN_EXPIRED),
            ResponseCodeEnum.UNAUTHORIZED,
          );
        }
      }
      throw error;
    }

    if (!payload?.id) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
        ResponseCodeEnum.UNAUTHORIZED,
      );
    }

    const existedUser = await this.userRepository.findOne({
      where: { id: payload.id },
    });

    if (!existedUser) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    // ensure provided refresh token matches the one stored for user
    if (
      !existedUser.refreshToken ||
      existedUser.refreshToken !== data.refreshToken
    ) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const newPayload: JwtPayload = {
      email: existedUser.email,
      fullname: existedUser.fullname,
      role: existedUser.role,
      id: existedUser.id,
    };

    const accessToken = await this.JwtService.signAsync(newPayload, {
      secret: authConfig?.accessSecret,
      expiresIn: authConfig?.accessExpires,
    });

    const refreshToken = await this.JwtService.signAsync(newPayload, {
      secret: authConfig?.refreshSecret,
      expiresIn: authConfig?.refreshExpires,
    });

    const response = plainToInstance(LoginResponseDTO, existedUser, {
      excludeExtraneousValues: true,
    });
    response.refreshToken = refreshToken;
    response.accessToken = accessToken;

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(await this.i18n.translate(I18nMessageKeys.SUCCESS))
      .build();
  }

  async login(data: LoginRequestDto) {
    const existedUser = await this.userRepository.findByEmail(data.email);
    if (!existedUser) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_OR_PASSWORD_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    if (existedUser.isLocked) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.ACCOUNT_IS_LOCKED),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const isMatch = await bcrypt.compare(data.password, existedUser.password);

    if (!isMatch) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_OR_PASSWORD_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    if (existedUser.isEnable2FA === IS_2FA_ENUM.ENABLED) {
      const authConfig = this.configService.get('auth', { infer: true });

      const otpPayload = {
        userId: existedUser.id,
        email: existedUser.email,
        timestamp: Date.now(),
      };

      const otpToken = await this.JwtService.signAsync(otpPayload, {
        secret: authConfig?.otpTokenSecret,
        expiresIn: authConfig?.otpTokenExpires,
      });

      const message = this.i18n.translate(I18nMessageKeys.OTP_REQUIRED);
      const response = plainToInstance(Login2FARequiredResponseDTO, {
        requires2FA: true,
        email: existedUser.email,
        otpToken: otpToken,
        message: message,
      });

      await this.redisService.set(
        this.get2FARedisKey(existedUser.id),
        otpToken,
        5 * 60,
      );

      return new ResponseBuilder(response)
        .withCode(ResponseCodeEnum.UNAUTHORIZED)
        .withMessage(message)
        .build();
    }

    const authConfig = this.configService.get('auth', { infer: true });

    const payload: JwtPayload = {
      email: existedUser.email,
      fullname: existedUser.fullname,
      role: existedUser.role,
      id: existedUser.id,
    };

    const accessToken = await this.JwtService.signAsync(payload, {
      secret: authConfig?.accessSecret,
      expiresIn: authConfig?.accessExpires,
    });

    const refreshToken = await this.JwtService.signAsync(payload, {
      secret: authConfig?.refreshSecret,
      expiresIn: authConfig?.refreshExpires,
    });

    await this.userRepository.update(existedUser.id, { refreshToken });

    const response = plainToInstance(
      LoginResponseDTO,
      {
        userData: existedUser,
        refreshToken,
        accessToken,
      },
      { excludeExtraneousValues: true },
    );
    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(await this.i18n.translate(I18nMessageKeys.LOGIN_SUCCESS))
      .build();
  }

  async toggle2fa(data: Toggle2faRequestDto) {
    const { user } = data;

    if (!user?.twoFactorSecret) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.TWO_FA_SECRET_NOT_SET),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    await this.verifyOtp2Fa(user.twoFactorSecret, data.otp);

    const isEnable2FA =
      user?.isEnable2FA === IS_2FA_ENUM.DISABLED
        ? IS_2FA_ENUM.ENABLED
        : IS_2FA_ENUM.DISABLED;

    if (user?.id) {
      await this.userRepository.update(user.id, { isEnable2FA });
    }

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        isEnable2FA === IS_2FA_ENUM.ENABLED
          ? await this.i18n.translate(I18nMessageKeys.ENABLE_2FA_SUCCESS)
          : await this.i18n.translate(I18nMessageKeys.DISABLE_2FA_SUCCESS),
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
        await this.i18n.translate(I18nMessageKeys.GENERATE_2FA_SECRET_SUCCESS),
      )
      .build();
  }

  async change2fa(data: Change2FaDto) {
    const { user } = data;

    await this.verifyOtp2Fa(user?.twoFactorSecret || '', data.otp);

    if (user?.id) {
      await this.userRepository.update(user.id, {
        twoFactorSecret: data.newTwoFactorSecret,
      });
    }
    const response = plainToInstance(Change2faResponseDto, {
      twoFactorSecret: data.newTwoFactorSecret,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        await this.i18n.translate(I18nMessageKeys.CHANGE_2FA_SECRET_SUCCESS),
      );
  }

  async login2fa(data: Login2FaRequestDto) {
    const authConfig = this.configService.get('auth', { infer: true });

    try {
      const otpPayload = await this.JwtService.verifyAsync<OtpTokenPayload>(
        data.otpToken,
        {
          secret: authConfig?.otpTokenSecret,
        },
      );

      const existedUser = await this.userRepository.findOne({
        where: { id: otpPayload.userId },
      });

      const isInvalidOtpToken = await this.redisService.exists(
        this.get2FARedisKey(otpPayload.userId),
      );

      if (!isInvalidOtpToken) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
          ResponseCodeEnum.BAD_REQUEST,
        );
      }

      if (!existedUser) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
          ResponseCodeEnum.NOT_FOUND,
        );
      }

      if (existedUser.isEnable2FA !== IS_2FA_ENUM.ENABLED) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.TWO_FA_SECRET_NOT_SET),
          ResponseCodeEnum.BAD_REQUEST,
        );
      }

      await this.verifyOtp2Fa(existedUser.twoFactorSecret || '', data.otp);

      const payload: JwtPayload = {
        email: existedUser.email,
        fullname: existedUser.fullname,
        role: existedUser.role,
        id: existedUser.id,
      };

      const accessToken = await this.JwtService.signAsync(payload, {
        secret: authConfig?.accessSecret,
        expiresIn: authConfig?.accessExpires,
      });

      const refreshToken = await this.JwtService.signAsync(payload, {
        secret: authConfig?.refreshSecret,
        expiresIn: authConfig?.refreshExpires,
      });

      await this.userRepository.update(existedUser.id, { refreshToken });

      await this.redisService.del(this.get2FARedisKey(existedUser.id));
      const response = plainToInstance(LoginResponseDTO, existedUser, {
        excludeExtraneousValues: true,
      });
      response.refreshToken = refreshToken;
      response.accessToken = accessToken;

      return new ResponseBuilder(response)
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(
          await this.i18n.translate(I18nMessageKeys.OTP_VERIFICATION_SUCCESS),
        )
        .build();
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError') {
          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.OTP_TOKEN_INVALID),
            ResponseCodeEnum.BAD_REQUEST,
          );
        }
        if (error.name === 'TokenExpiredError') {
          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.OTP_TOKEN_EXPIRED),
            ResponseCodeEnum.BAD_REQUEST,
          );
        }
      }
      throw error;
    }
  }

  private async verifyOtp2Fa(
    twoFactorSecret: string,
    otp: string,
  ): Promise<boolean> {
    const verificationResult = twoFactor.verifyToken(twoFactorSecret, otp);
    if (!verificationResult || verificationResult.delta !== 0) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.OTP_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }
    return true;
  }

  async forgotPassword(data: ForgotPasswordRequestDto) {
    const user = await this.userRepository.findByEmail(data.email);
    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!user) {
      throw new BusinessException(
        this.i18n.translate(I18nErrorKeys.EMAIL_NOT_EXIST),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    const forgotPasswordTokenPayload: ForgotPasswordTokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const forgotPasswordToken = await this.JwtService.signAsync(
      forgotPasswordTokenPayload,
      {
        secret: authConfig?.forgotPasswordSecret,
        expiresIn: authConfig?.forgotPasswordExpires,
      },
    );

    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        user.fullname || 'User',
        forgotPasswordToken,
      );
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }

    const message: string = this.i18n.translate(
      I18nMessageKeys.FORGOT_PASSWORD_EMAIL_SENT,
    );
    await this.redisService.set(
      this.getForgotPasswordRedisKey(user?.id),
      forgotPasswordToken,
    );
    const response = plainToInstance(ForgotPasswordResponseDto, {
      message,
      email: data.email,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async resetPassword(data: ResetPasswordRequestDto) {
    const authConfig = this.configService.get<AuthConfig>('auth');

    let tokenPayload: ForgotPasswordTokenPayload | null = null;
    try {
      tokenPayload = this.JwtService.verify<ForgotPasswordTokenPayload>(
        data?.token,
        {
          secret: authConfig?.forgotPasswordSecret,
        },
      );
    } catch {
      throw new BusinessException(
        this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: tokenPayload?.userId },
    });

    const isInvalidToken = await this.redisService.exists(
      this.getForgotPasswordRedisKey(user?.id || ''),
    );

    if (!isInvalidToken) {
      throw new BusinessException(
        this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    if (!user) {
      throw new BusinessException(
        this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    await user.setAndHashPassword(data.newPassword);
    await this.userRepository.save(user);

    await this.redisService.del(this.getForgotPasswordRedisKey(user?.id));

    try {
      await this.mailService.sendPasswordResetSuccessEmail(
        user.email,
        user.fullname || 'User',
      );
    } catch (error) {
      console.error('Error sending password reset success email:', error);
    }

    const message: string = this.i18n.translate(
      I18nMessageKeys.RESET_PASSWORD_SUCCESS,
    );
    const response = plainToInstance(ResetPasswordResponseDto, {
      message,
      success: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async changePassword(userId: string, data: ChangePasswordRequestDto) {
    await this.userService.getUserById(userId);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException(
        this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    await user.setAndHashPassword(data?.newPassword || '');
    await this.userRepository.save(user);

    return (
      await new ResponseBuilder().withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }
}
