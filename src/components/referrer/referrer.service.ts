import { Injectable } from '@nestjs/common';
import { ReferrerRepository } from '@database/repositories';
import { CreateReferrerDto } from './dto/request/create-referrer.request.dto';
import { UpdateReferrerDto } from './dto/request/update-referrer.request.dto';
import { GetListReferrerRequestDto } from './dto/request/get-list-referrer.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { I18nService } from 'nestjs-i18n';
import { getPayloadFromRequest } from '@utils/common';
import { plainToInstance } from 'class-transformer';
import { ReferrerResponseDto } from './dto/response/referrer.response.dto';

@Injectable()
export class ReferrerService {
  constructor(
    private readonly i18n: I18nService,
    private readonly referrerRepository: ReferrerRepository,
  ) {}

  async createReferrer(data: CreateReferrerDto, userId: string) {
    const payload = getPayloadFromRequest(data);

    // Check if referrer already exists for this user
    const existingReferrer =
      await this.referrerRepository.findByReferrerAndUser(
        payload.referrer,
        userId,
      );
    if (existingReferrer) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(
          this.i18n.translate('referrer.error.REFERRER_ALREADY_EXISTS'),
        )
        .build();
    }

    const referrer = this.referrerRepository.create({
      ...payload,
      userId,
    });
    const savedReferrer = await this.referrerRepository.save(referrer);

    return new ResponseBuilder(savedReferrer)
      .withCode(ResponseCodeEnum.CREATED)
      .build();
  }

  async getAllReferrers(userId: string) {
    const referrers = await this.referrerRepository.findByUser(userId);
    return new ResponseBuilder(referrers)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async list(request: GetListReferrerRequestDto, userId: string) {
    const { page, limit } = request;

    const { data, total } = await this.referrerRepository.findByUser(
      userId,
      page,
      limit,
    );

    const response = plainToInstance(ReferrerResponseDto, data, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder({
      items: response,
      meta: {
        total,
        page,
        limit,
      },
    })
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async getReferrerById(id: string, userId: string) {
    const referrer = await this.referrerRepository.findById(id);
    if (!referrer) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.NOT_FOUND)
        .withMessage(this.i18n.translate('referrer.error.REFERRER_NOT_FOUND'))
        .build();
    }

    // Check if referrer belongs to the user
    if (referrer.userId !== userId) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.FORBIDDEN)
        .withMessage(this.i18n.translate('error.FORBIDDEN'))
        .build();
    }

    return new ResponseBuilder(referrer)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async updateReferrer(id: string, data: UpdateReferrerDto, userId: string) {
    const payload = getPayloadFromRequest(data);

    // Check if referrer exists
    const existingReferrer = await this.referrerRepository.findById(id);
    if (!existingReferrer) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.NOT_FOUND)
        .withMessage(this.i18n.translate('referrer.error.REFERRER_NOT_FOUND'))
        .build();
    }

    // Check if referrer belongs to the user
    if (existingReferrer.userId !== userId) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.FORBIDDEN)
        .withMessage(this.i18n.translate('error.FORBIDDEN'))
        .build();
    }

    // If referrer field is being updated, check if the new value already exists for this user
    if (payload.referrer && payload.referrer !== existingReferrer.referrer) {
      const duplicateReferrer =
        await this.referrerRepository.findByReferrerAndUser(
          payload.referrer,
          userId,
        );
      if (duplicateReferrer) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(
            this.i18n.translate('referrer.error.REFERRER_ALREADY_EXISTS'),
          )
          .build();
      }
    }

    Object.assign(existingReferrer, payload);
    const updatedReferrer =
      await this.referrerRepository.save(existingReferrer);

    return new ResponseBuilder(updatedReferrer)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async deleteReferrer(id: string, userId: string) {
    // Check if referrer exists
    const existingReferrer = await this.referrerRepository.findById(id);
    if (!existingReferrer) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.NOT_FOUND)
        .withMessage(this.i18n.translate('referrer.error.REFERRER_NOT_FOUND'))
        .build();
    }

    // Check if referrer belongs to the user
    if (existingReferrer.userId !== userId) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.FORBIDDEN)
        .withMessage(this.i18n.translate('error.FORBIDDEN'))
        .build();
    }

    await this.referrerRepository.softDelete(id);

    return new ResponseBuilder().withCode(ResponseCodeEnum.SUCCESS).build();
  }
}
