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
import { ErrorCodeEnum, ResponseCodeEnum } from '@constant/response-code.enum';
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
import { OAuthUser } from './strategies/google.strategy';
import { JwtVerifyEmailPayload } from '@core/types/jwt-payload-verify-email.type';
import { BOOLEAN_ENUM } from '@constant/app.enum';
import { ResendVerifyEmailResponseDto } from './dto/response/resend-email.response.dto';
import QRCode from 'qrcode';
import { OAuthValidationResponseDto } from './dto/response/validate-oauth.response.dto';

@Injectable()
export class AuthService {
  private readonly MAX_2FA_ATTEMPTS = 5;

  constructor(
    private readonly i18n: I18nService,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  private get2FARedisKey(token: string): string {
    return `auth:login-2fa-token:${token}`;
  }

  private get2FAAttemptRedisKey(token: string): string {
    return `auth:login-2fa-attempts:${token}`;
  }

  private getForgotPasswordRedisKey(token: string): string {
    return `auth:forgot-password-token:${token}`;
  }

  private getVerifyEmailRedisKey(token: string): string {
    return `auth:verify-email:${token}`;
  }

  private async handle2FARequired(user: User) {
    const authConfig = this.configService.get('auth', { infer: true });

    const otpPayload = {
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
    };

    const otpToken = await this.JwtService.signAsync(otpPayload, {
      secret: authConfig?.otpTokenSecret,
      expiresIn: authConfig?.otpTokenExpires,
    });

    const message = this.i18n.translate(I18nMessageKeys.OTP_REQUIRED);
    const response = plainToInstance(Login2FARequiredResponseDTO, {
      requires2FA: true,
      email: user.email,
      otpToken: otpToken,
      message: message,
    });

    // Store token with userId as value for verification
    await this.redisService.set(this.get2FARedisKey(otpToken), user.id, 5 * 60);

    // Initialize attempt counter for this token
    await this.redisService.set(
      this.get2FAAttemptRedisKey(otpToken),
      '0',
      5 * 60,
    );

    return {
      response,
      message,
      otpToken,
    };
  }

  async register(data: RegisterRequestDTO) {
    const existedUser = await this.userRepository.findByEmail(data.email);

    if (existedUser) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_EXIST),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const { secret, uri } = twoFactor.generateSecret();
    const qrCodeDataUrl: string = await QRCode.toDataURL(uri);

    const user = this.userRepository.create({
      email: data.email,
      fullname: data.fullname,
      password: data.password,
      gender: data.gender,
      phone: data.phone,
      createdBy: data.userId,
      twoFactorSecret: secret,
      twoFactorQr: qrCodeDataUrl,
      twoFactorUri: uri,
      isLocked: USER_LOCKED_ENUM.UNLOCKED,
      role: USER_ROLE_ENUM.USER,
      dateOfBirth: data.dateOfBirth,
    });

    const savedUser = await this.userRepository.save(user);

    // Tạo token xác minh email
    const authConfig = this.configService.get<AuthConfig>('auth');
    const verifyTokenPayload: JwtVerifyEmailPayload = {
      id: savedUser.id,
      email: savedUser.email,
    };
    const verifyToken = this.JwtService.sign(verifyTokenPayload, {
      secret: authConfig?.verifyEmailSecret,
      expiresIn: authConfig?.verifyEmailExpires,
    });

    await this.redisService.set(
      this.getVerifyEmailRedisKey(verifyToken),
      savedUser.id,
      15 * 60,
    );

    try {
      await this.mailService.sendVerificationEmail(
        savedUser.email,
        savedUser.fullname || 'User',
        verifyToken,
      );
    } catch (error) {
      console.error('Error sending verification emailopilot:', error);
    }

    const response = plainToInstance(RegisterResponseDTO, savedUser, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.CREATED)
      .withMessage(await this.i18n.translate(I18nMessageKeys.REGISTER_SUCCESS))
      .build();
  }

  async verifyEmail(verifyToken: string) {
    const authConfig = this?.configService?.get<AuthConfig>('auth');

    // Xác minh token
    let tokenPayload: JwtVerifyEmailPayload;
    try {
      tokenPayload = await this.JwtService.verifyAsync<JwtVerifyEmailPayload>(
        verifyToken,
        {
          secret: authConfig?.verifyEmailSecret,
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const storedUserId = await this.redisService.get(
      this.getVerifyEmailRedisKey(verifyToken),
    );
    if (!storedUserId || storedUserId !== tokenPayload?.id) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: tokenPayload.id },
    });
    if (!user) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (user.isVerified) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_ALREADY_VERIFIED),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    await this.userRepository.update(user.id, {
      isVerified: BOOLEAN_ENUM.TRUE,
    });
    await this.redisService.del(this.getVerifyEmailRedisKey(verifyToken));

    const response = { success: true };
    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        await this.i18n.translate(I18nMessageKeys.VERIFY_EMAIL_SUCCESS),
      )
      .build();
  }

  async resendVerifyEmail(data: ForgotPasswordRequestDto) {
    const user = await this.userRepository.findByEmail(data.email);
    const authConfig = this.configService.get<AuthConfig>('auth');

    if (!user) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_NOT_EXIST),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (user.isVerified) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_ALREADY_VERIFIED),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const verifyTokenPayload: JwtVerifyEmailPayload = {
      id: user.id,
      email: user.email,
    };

    const verifyToken = await this.JwtService.signAsync(verifyTokenPayload, {
      secret: authConfig?.verifyEmailSecret,
      expiresIn: authConfig?.verifyEmailExpires,
    });

    await this.redisService.set(
      this.getVerifyEmailRedisKey(verifyToken),
      user.id,
      15 * 60,
    );

    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        user.fullname || 'User',
        verifyToken,
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
    }

    const response = plainToInstance(ResendVerifyEmailResponseDto, {
      email: data.email,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(this.i18n.translate(I18nMessageKeys.VERIFY_EMAIL_SENT))
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

    if (!existedUser.isVerified) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.EMAIL_NOT_VERIFIED),
        ResponseCodeEnum.BAD_REQUEST,
        ErrorCodeEnum.EMAIL_NOT_VERIFIED,
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
      const { response, message } = await this.handle2FARequired(existedUser);

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

  async login2fa(data: Login2FaRequestDto) {
    const authConfig = this.configService.get('auth', { infer: true });

    try {
      const otpPayload = await this.JwtService.verifyAsync<OtpTokenPayload>(
        data.otpToken,
        {
          secret: authConfig?.otpTokenSecret,
        },
      );

      const storedUserId = await this.redisService.get(
        this.get2FARedisKey(data.otpToken),
      );

      if (!storedUserId) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
          ResponseCodeEnum.BAD_REQUEST,
        );
      }

      const currentAttempts = await this.redisService.get(
        this.get2FAAttemptRedisKey(data.otpToken),
      );

      const attemptCount = parseInt(currentAttempts || '0', 10);

      if (attemptCount >= this.MAX_2FA_ATTEMPTS) {
        await this.redisService.del(this.get2FARedisKey(data.otpToken));
        await this.redisService.del(this.get2FAAttemptRedisKey(data.otpToken));

        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.TOO_MANY_ATTEMPTS),
          ResponseCodeEnum.TOO_MANY_REQUESTS,
        );
      }

      if (storedUserId !== otpPayload.userId) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.TOKEN_INVALID),
          ResponseCodeEnum.BAD_REQUEST,
        );
      }

      const existedUser = await this.userRepository.findOne({
        where: { id: otpPayload.userId },
      });

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

      try {
        await this.verifyOtp2Fa(existedUser.twoFactorSecret || '', data.otp);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (otpError) {
        const newAttemptCount = attemptCount + 1;
        await this.redisService.set(
          this.get2FAAttemptRedisKey(data.otpToken),
          newAttemptCount.toString(),
          5 * 60,
        );

        if (newAttemptCount >= this.MAX_2FA_ATTEMPTS) {
          await this.redisService.del(this.get2FARedisKey(data.otpToken));
          await this.redisService.del(
            this.get2FAAttemptRedisKey(data.otpToken),
          );

          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.TOO_MANY_ATTEMPTS),
            ResponseCodeEnum.TOO_MANY_REQUESTS,
          );
        }

        throw new BusinessException(
          this.i18n.translate(I18nErrorKeys.OTP_INVALID) +
            ` (${newAttemptCount}/${this.MAX_2FA_ATTEMPTS} attempts)`,
          ResponseCodeEnum.BAD_REQUEST,
        );
      }

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

      // Clean up the used tokens from Redis on successful login
      await this.redisService.del(this.get2FARedisKey(data.otpToken));
      await this.redisService.del(this.get2FAAttemptRedisKey(data.otpToken));

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
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError') {
          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.OTP_TOKEN_INVALID),
            ResponseCodeEnum.BAD_REQUEST,
          );
        }
        if (error.name === 'TokenExpiredError') {
          await this.redisService.del(this.get2FARedisKey(data.otpToken));
          await this.redisService.del(
            this.get2FAAttemptRedisKey(data.otpToken),
          );

          throw new BusinessException(
            await this.i18n.translate(I18nErrorKeys.OTP_TOKEN_EXPIRED),
            ResponseCodeEnum.BAD_REQUEST,
          );
        }
      }
      throw error;
    }
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

    const { secret, uri } = twoFactor.generateSecret({
      name: appConfig?.appName,
      account: user?.email || '',
    });
    const qrCodeDataUrl: string = await QRCode.toDataURL(uri);
    const response = {
      secret,
      qrCodeUrl: qrCodeDataUrl,
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
      )
      .build();
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

    // Store token with userId as value for verification
    await this.redisService.set(
      this.getForgotPasswordRedisKey(forgotPasswordToken),
      user.id,
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
        await this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Check if token exists in Redis
    const storedUserId = await this.redisService.get(
      this.getForgotPasswordRedisKey(data.token),
    );

    if (!storedUserId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Verify the stored userId matches with token payload
    if (storedUserId !== tokenPayload?.userId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Now fetch user data (only once after all validations)
    const user = await this.userRepository.findOne({
      where: { id: tokenPayload?.userId },
    });

    if (!user) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.RESET_TOKEN_INVALID),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    await user.setAndHashPassword(data.newPassword);
    await this.userRepository.save(user);

    // Clean up the used token from Redis
    await this.redisService.del(this.getForgotPasswordRedisKey(data.token));

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

  async validateOAuthLogin({
    oauthProvider,
    oauthProviderId,
    email,
    fullname,
  }: OAuthUser) {
    let user = await this.userRepository.findOne({
      where: { email, oauthProvider, oauthProviderId },
    });

    if (
      user?.isVerified === BOOLEAN_ENUM.TRUE &&
      !user?.oauthProvider &&
      !user?.oauthProviderId
    ) {
      await this.userRepository.update(user.id, {
        oauthProvider,
        oauthProviderId,
      });
    } else if (
      user?.isVerified === BOOLEAN_ENUM.FALSE &&
      !user?.oauthProvider &&
      !user?.oauthProviderId
    ) {
      await this.userRepository.softDelete(user.id);
      user = null;
    }

    if (user && user.isLocked === USER_LOCKED_ENUM.LOCKED) {
      const response = plainToInstance(OAuthValidationResponseDto, {
        success: false,
        isLocked: true,
        message: this.i18n.translate(I18nErrorKeys.ACCOUNT_IS_LOCKED),
        email,
      });

      return new ResponseBuilder(response)
        .withCode(ResponseCodeEnum.UNAUTHORIZED)
        .withMessage(await this.i18n.translate(I18nErrorKeys.ACCOUNT_IS_LOCKED))
        .build();
    }

    if (!user) {
      const { secret, uri } = twoFactor.generateSecret();
      const qrCodeDataUrl: string = await QRCode.toDataURL(uri);

      user = this.userRepository.create({
        email,
        fullname,
        role: USER_ROLE_ENUM.USER,
        isLocked: USER_LOCKED_ENUM.UNLOCKED,
        oauthProvider: oauthProvider,
        oauthProviderId: oauthProviderId,
        isEnable2FA: IS_2FA_ENUM.DISABLED,
        twoFactorSecret: secret,
        twoFactorUri: uri,
        twoFactorQr: qrCodeDataUrl,
        isVerified: BOOLEAN_ENUM.TRUE,
      });
      await this.userRepository.save(user);
    }

    if (user.isEnable2FA === IS_2FA_ENUM.ENABLED) {
      const { otpToken } = await this.handle2FARequired(user);

      const response = plainToInstance(OAuthValidationResponseDto, {
        requires2FA: true,
        email: user.email,
        otpToken: otpToken,
        message: this.i18n.translate(I18nMessageKeys.OTP_REQUIRED),
      });

      return new ResponseBuilder(response)
        .withCode(ResponseCodeEnum.UNAUTHORIZED)
        .withMessage(await this.i18n.translate(I18nMessageKeys.OTP_REQUIRED))
        .build();
    }

    const authConfig = this.configService.get('auth', { infer: true });
    const payload: JwtPayload = {
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      id: user.id,
    };

    const accessToken = await this.JwtService.signAsync(payload, {
      secret: authConfig?.accessSecret,
      expiresIn: authConfig?.accessExpires,
    });

    const refreshToken = await this.JwtService.signAsync(payload, {
      secret: authConfig?.refreshSecret,
      expiresIn: authConfig?.refreshExpires,
    });

    await this.userRepository.update(user.id, { refreshToken });

    const response: OAuthValidationResponseDto = plainToInstance(
      OAuthValidationResponseDto,
      {
        success: true,
        requires2FA: false,
        userData: user,
        accessToken,
        refreshToken,
        oauthProvider,
        oauthProviderId,
        email,
        fullname: user.fullname,
        isEnable2FA: user.isEnable2FA || IS_2FA_ENUM.DISABLED,
        message: this.i18n.translate(I18nMessageKeys.LOGIN_SUCCESS),
      },
    );

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(await this.i18n.translate(I18nMessageKeys.LOGIN_SUCCESS))
      .build();
  }
}
