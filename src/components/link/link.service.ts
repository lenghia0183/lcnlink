import { Injectable } from '@nestjs/common';
import { LinkRepository } from '@database/repositories';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { CreateLinkRequestDto } from './dto/request/create-link.request.dto';
import { UpdateLinkRequestDto } from './dto/request/update-link.request.dto';
import { GetListLinkRequestDto } from './dto/request/get-list-link.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';
import { LinkResponseDto } from './dto/response/link.response.dto';
import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { I18nErrorKeys } from '@constant/i18n-keys.enum';
import { AppConfig } from '@config/config.type';
import { getPayloadFromRequest } from '@utils/common';

@Injectable()
export class LinkService {
  constructor(
    private readonly i18n: I18nService,
    private readonly linkRepository: LinkRepository,
    private readonly configService: ConfigService,
  ) {}

  private generateAlias(length = 10) {
    return uuidv4().replace(/-/g, '').slice(0, length);
  }

  async createLink(data: CreateLinkRequestDto) {
    let alias = data.alias;
    if (alias) {
      const exists = await this.linkRepository.findByAlias(alias);
      console.log('exists', exists);
      if (exists) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage('Alias already exists');
      }
    } else {
      alias = this.generateAlias(10);
    }

    const appConfig = this.configService.get<AppConfig>('app');
    const frontendUrl =
      (appConfig && appConfig.frontendUrl) || 'http://localhost:3000';
    const shortedUrl = `${frontendUrl.replace(/\/$/, '')}/r/${alias}`;

    const saved = await this.linkRepository.createLink({
      originalUrl: data.originalUrl,
      alias,
      shortedUrl,
      password: data.password,
      userId: data.userId,
      maxClicks: data.maxClicks,
      expireAt: data.expireAt ? new Date(String(data.expireAt)) : undefined,
    });

    const response = plainToInstance(LinkResponseDto, saved, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.CREATED,
        this.i18n,
      )
    ).build();
  }

  async updateLink(id: string, request: UpdateLinkRequestDto, userId: string) {
    const payload = getPayloadFromRequest(request);

    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (link.userId !== userId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FORBIDDEN),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    if (payload.alias && payload.alias !== link.alias) {
      const exists = await this.linkRepository.findByAlias(payload.alias);
      if (exists && exists.id !== link.id) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage('Alias already exists');
      }

      const appConfig = this.configService.get<AppConfig>('app');
      const frontendUrl =
        (appConfig && appConfig.frontendUrl) || 'http://localhost:3000';

      const newShortedUrl = `${frontendUrl.replace(/\/$/, '')}/r/${payload.alias}`;
      link.shortedUrl = newShortedUrl;
    }

    Object.assign(link, { ...payload });

    const saved = await this.linkRepository.save(link);

    const response = plainToInstance(LinkResponseDto, saved, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async deleteLink(id: string) {
    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    await this.linkRepository.softDelete(id);

    return (
      await new ResponseBuilder().withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async getById(id: string) {
    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    const response = plainToInstance(LinkResponseDto, link, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async getByAlias(alias: string) {
    const link = await this.linkRepository.findByAlias(alias);
    if (!link) return null;
    return link;
  }

  async toggleActiveLink(id: string) {
    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    link.isActive = !link.isActive;
    const saved = await this.linkRepository.save(link);

    const response = plainToInstance(LinkResponseDto, saved, {
      excludeExtraneousValues: true,
    });

    return (
      await new ResponseBuilder(response).withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async handleRedirect(alias: string) {
    const link = await this.getByAlias(alias);
    if (!link) return null;

    // increment clicks count
    await this.linkRepository.incrementClicksCount(link.id, 1);

    // optionally record Click entity here (omitted for brevity)

    return link;
  }

  async list(request: GetListLinkRequestDto, isExport = false) {
    const { keyword, sort, filter, page, limit } = request;

    const { data, total } = await this.linkRepository.findWithFilters({
      keyword,
      filter,
      sort,
      page,
      limit,
      isExport,
    });

    const response = plainToInstance(LinkResponseDto, data, {
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
