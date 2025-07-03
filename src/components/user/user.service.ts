import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import * as twoFactor from 'node-2fa';

import { User } from '@database/entities/user.entity';
import { UserRepository } from '@database/repositories/user/user.repository';
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

  async createUser(data: CreateUserRequestDto) {
    const { secret } = twoFactor.generateSecret();

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
    });

    // Save user to database
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

  async updateUser(id: string, data: UpdateUserRequestDto) {
    const user = await this.getUserById(id);

    Object.assign(user, {
      ...data,
    });

    await this.userRepository.save(user);

    const response = plainToInstance(UpdateUserResponseDto, user, {
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

  async list(
    request: GetListUserRequestDto,
    isExport = false,
  ): Promise<{ data: User[]; total: number }> {
    const { keyword, page, limit } = request;

    if (isEmpty(keyword)) {
      const users = await this.userRepository.findAll();
      const total = await this.userRepository.count();

      if (!isExport && page && limit) {
        const skip = (page - 1) * limit;
        const paginatedUsers = users.slice(skip, skip + limit);
        return { data: paginatedUsers, total };
      }

      return { data: users, total };
    }

    // Sử dụng method findWithKeyword từ repository
    const paginationParams =
      !isExport && page && limit ? { page, limit } : undefined;
    return this.userRepository.findWithKeyword(
      keyword || '',
      paginationParams?.page,
      paginationParams?.limit,
    );
  }

  async getSummaryUsers(): Promise<{ role: number; count: number }[]> {
    return this.userRepository.getUserSummaryByRole();
  }
}
