import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { isEmpty } from 'lodash';
import * as twoFactor from 'node-2fa';

import { User } from '@database/entities/user.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Basic CRUD operations
  findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { deletedAt: IsNull() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  count(): Promise<number> {
    return this.userRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email },
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });

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

    const response = plainToInstance(UpdateUserResponseDto, user);

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async getDetail(id: string) {
    const user = this.getUserById(id);

    const response = plainToInstance(GetUserDetailResponseDto, user);

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

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Add where condition for soft delete
    queryBuilder.where('user.deletedAt IS NULL');

    // Add keyword search
    if (!isEmpty(keyword)) {
      queryBuilder.andWhere(
        '(user.email ILIKE :keyword OR user.fullname ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // Add pagination
    if (!isExport && page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    // Add default sorting
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return { data: users, total };
  }

  async getSummaryUsers(): Promise<{ role: number; count: number }[]> {
    const summary = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.deletedAt IS NULL')
      .groupBy('user.role')
      .getRawMany();

    return summary.map((item) => {
      const { role, count } = item as { role: unknown; count: unknown };
      return {
        role: parseInt(String(role)) || 0,
        count: parseInt(String(count)) || 0,
      };
    });
  }
}
