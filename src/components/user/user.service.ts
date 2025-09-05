import { Injectable } from '@nestjs/common';
import * as twoFactor from 'node-2fa';

import { User } from '@database/entities/user.entity';
import { UserRepository } from '@database/repositories';
import { CreateUserRequestDto } from './dto/request/create-user.request.dto';
import { UpdateUserRequestDto } from './dto/request/update-user.request.dto';
import { GetListUserRequestDto } from './dto/request/get-list-user.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';

import { CreateUserResponseDTo } from './dto/response/create-user.response.dto';
import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { UpdateUserResponseDto } from './dto/response/update-user.response.dto';
import { I18nErrorKeys } from '@constant/i18n-keys.enum';
import { GetUserDetailResponseDto } from './dto/response/get-user-detail.response.dto';
import { getPayloadFromRequest } from '@utils/common';

import { USER_LOCKED_ENUM } from './user.constant';
import { Not } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    private readonly i18n: I18nService,
    private readonly userRepository: UserRepository,
  ) {}

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }
    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }
    return user;
  }

  async deleteUser(id: string) {
    await this.getUserById(id);

    await this.userRepository.softDelete(id);

    return (
      await new ResponseBuilder().withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async toggleUserLockStatus(id: string) {
    const user = await this.getUserById(id);

    user.isLocked =
      user.isLocked === USER_LOCKED_ENUM.LOCKED
        ? USER_LOCKED_ENUM.LOCKED
        : USER_LOCKED_ENUM.UNLOCKED;
    const updatedUser = await this.userRepository.save(user);

    const response = plainToInstance(GetUserDetailResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async createUser(data: CreateUserRequestDto) {
    const isEmailExists = await this.userRepository.isEmailExists(data.email);

    if (isEmailExists) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(this.i18n.translate(I18nErrorKeys.EMAIL_EXIST));
    }

    const { secret, uri, qr } = twoFactor.generateSecret();

    const user = this.userRepository.create({
      email: data.email,
      fullname: data.fullname,
      password: data.password,
      role: data.role,
      gender: data.gender,
      phone: data.phone,
      avatar: data.avatar,
      createdBy: data.userId,
      twoFactorSecret: secret,
      twoFactorQr: qr,
      twoFactorUri: uri,
    });

    const savedUser = await this.userRepository.save(user);

    const response = plainToInstance(CreateUserResponseDTo, savedUser, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.CREATED,
        this.i18n,
      )
    ).build();
  }

  async updateUser(id: string, request: UpdateUserRequestDto) {
    const payload = getPayloadFromRequest(request);

    if (payload.email) {
      const isEmailExists = await this.userRepository.findOne({
        where: {
          email: payload.email,
          id: Not(id),
        },
      });
      if (isEmailExists) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(await this.i18n.translate(I18nErrorKeys.EMAIL_EXIST))
          .build();
      }
    }
    const user = await this.getUserById(id);

    Object.assign(user, {
      ...payload,
    });

    const updatedUser = await this.userRepository.save(user);

    const response = plainToInstance(UpdateUserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async getDetail(id: string) {
    const user = await this.getUserById(id);

    const response = plainToInstance(GetUserDetailResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async list(request: GetListUserRequestDto, isExport = false) {
    const { keyword, sort, filter, page, limit } = request;

    const { data, total } = await this.userRepository.findUsersWithFilters({
      keyword,
      filter,
      sort,
      page,
      limit,
      isExport,
    });

    const response = plainToInstance(GetUserDetailResponseDto, data, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder({
        items: response,
        meta: {
          total,
          page,
          limit,
        },
      }).withCodeI18n(ResponseCodeEnum.SUCCESS, this.i18n)
    ).build();
  }
}
