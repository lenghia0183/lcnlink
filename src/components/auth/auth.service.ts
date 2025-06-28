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

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

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
}
