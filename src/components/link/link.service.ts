import { Injectable } from '@nestjs/common';
import { LinkRepository, ClickRepository } from '@database/repositories';
import { ConfigService } from '@nestjs/config';
import { v4 as GenerateUUID } from 'uuid';
import { CreateLinkRequestDto } from './dto/request/create-link.request.dto';
import { UpdateLinkRequestDto } from './dto/request/update-link.request.dto';
import { GetListLinkRequestDto } from './dto/request/get-list-link.request.dto';
import { VerifyPasswordRequestDto } from './dto/request/verify-password.request.dto';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';
import { LinkResponseDto } from './dto/response/link.response.dto';
import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { I18nErrorKeys, I18nMessageKeys } from '@constant/i18n-keys.enum';
import { AppConfig } from '@config/config.type';
import { getPayloadFromRequest } from '@utils/common';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { LINK_STATUS } from './link.constant';
import { GetTotalLinkPerStatusResponseDto } from './dto/response/get-total-link-per-status.response.dto';
import { GetLinkStatisticOverviewResponseDto } from './dto/response/get-link-statistic-overview.response.dto';
import { AnalyticsQueryDto } from './dto/request/analytics.query.dto';
import geoip from 'geoip-lite';
import { ReferrerRepository } from '@database/repositories';
import { Referrer } from '@database/entities/referrer.entity';
import {
  BrowserCountDto,
  CountryCountDto,
  DeviceCountDto,
  TrendPointDto,
} from './dto/response/combined-analytics.response.dto';
import { GetSingleLinkStatisticResponseDto } from './dto/response/get-single-link-statistic.response.dto';

@Injectable()
export class LinkService {
  constructor(
    private readonly i18n: I18nService,
    private readonly linkRepository: LinkRepository,
    private readonly clickRepository: ClickRepository,
    private readonly referrerRepository: ReferrerRepository,
    private readonly configService: ConfigService,
  ) {}

  private generateAlias(length = 10) {
    return GenerateUUID().replace(/-/g, '').slice(0, length);
  }

  private getClientInfo(req: Request) {
    const ipRaw =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown';

    const ip = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw;
    const userAgent = req.get('user-agent') || '';

    let referrer = req.get('referer') || '';

    const urlParams = req.query;
    if (urlParams.src) {
      referrer = urlParams.src as string;
    }

    let country = 'Unknown';
    let countryCode = '';

    if (ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
      const geo = geoip.lookup(ip);
      if (geo) {
        country = geo.country || 'Unknown';
        countryCode = geo.country || '';
      }
    }

    let device = 'Unknown';
    let browser = 'Unknown';

    if (userAgent) {
      if (userAgent.includes('Mobile')) {
        device = 'Mobile';
      } else if (userAgent.includes('Tablet')) {
        device = 'Tablet';
      } else {
        device = 'Desktop';
      }

      if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
      } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
      } else if (userAgent.includes('Opera')) {
        browser = 'Opera';
      }
    }

    return {
      ipAddress: ip,
      device,
      browser,
      referrer,
      country,
      countryCode,
    };
  }

  async createLink(data: CreateLinkRequestDto, userId: string | null) {
    let alias = data.alias;
    if (alias) {
      const exists = await this.linkRepository.findByAlias(alias);

      if (exists) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(
            await this.i18n.translate(I18nErrorKeys.LINK_ALIAS_EXISTS),
          )
          .build();
      }
    } else {
      alias = this.generateAlias(10);
    }

    if (data.referrerId) {
      const referrer = await this.referrerRepository.findById(data.referrerId);
      if (!referrer) {
        throw new BusinessException(
          await this.i18n.translate(I18nErrorKeys.LINK_REFERRER_NOT_FOUND),
          ResponseCodeEnum.BAD_REQUEST,
        );
      }
    }

    const appConfig = this.configService.get<AppConfig>('app');
    const backendUrl =
      (appConfig && appConfig.backendUrl) || 'http://localhost:3001';

    let shortedUrl = `${backendUrl.replace(/\/$/, '')}/r/${alias}`;

    if (data.referrerId) {
      const referrer = await this.referrerRepository.findById(data.referrerId);
      if (referrer) {
        shortedUrl += `?src=${encodeURIComponent(referrer.referrer)}`;
      }
    }

    const saved = await this.linkRepository.createLink({
      originalUrl: data.originalUrl,
      alias,
      shortedUrl,
      password: data.password || '',
      userId: userId || null,
      maxClicks: data.maxClicks,
      expireAt: data.expireAt ? new Date(String(data.expireAt)) : undefined,
      isUsePassword: !!data.password,
      referrerId: data.referrerId || null,
    });

    const response = plainToInstance(LinkResponseDto, saved, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.CREATED)
      .withMessage(
        await this.i18n.translate(I18nMessageKeys.LINK_CREATE_SUCCESS),
      )
      .build();
  }

  async updateLink(id: string, request: UpdateLinkRequestDto, userId: string) {
    const payload = getPayloadFromRequest(request);

    const link = await this.linkRepository.findOne({ where: { id } });
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (link.userId !== userId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_PERMISSION_DENIED),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    const appConfig = this.configService.get<AppConfig>('app');
    const backendUrl = (
      appConfig?.backendUrl || 'http://localhost:3001'
    ).replace(/\/$/, '');

    if (payload.alias && payload.alias !== link.alias) {
      const exists = await this.linkRepository.findByAlias(payload.alias);
      if (exists && exists.id !== link.id) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(
            await this.i18n.translate(I18nErrorKeys.LINK_ALIAS_EXISTS),
          )
          .build();
      }
      link.alias = payload.alias;
    }

    let referrer: Referrer | null = null;
    if (payload.referrerId && payload.referrerId !== link.referrerId) {
      referrer = await this.referrerRepository.findById(payload.referrerId);
      if (referrer) {
        link.referrerId = payload.referrerId;
        link.shortedUrl = `${backendUrl}/r/${link.alias}?src=${encodeURIComponent(referrer.referrer)}`;
      } else {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(
            await this.i18n.translate(I18nErrorKeys.LINK_REFERRER_NOT_FOUND),
          )
          .build();
      }
    } else if (link.referrerId) {
      referrer = await this.referrerRepository.findById(link.referrerId);
      link.shortedUrl = referrer
        ? `${backendUrl}/r/${link.alias}?src=${encodeURIComponent(referrer.referrer)}`
        : `${backendUrl}/r/${link.alias}`;
    } else {
      link.shortedUrl = `${backendUrl}/r/${link.alias}`;
    }

    if (payload.maxClicks === null || payload.maxClicks === undefined) {
      link.maxClicks = null;
    }

    let password: string | undefined = link.password;

    if (
      'currentPassword' in payload &&
      payload.currentPassword !== undefined &&
      'newPassword' in payload &&
      payload.newPassword !== undefined
    ) {
      if (link.password) {
        const isCurrentPasswordValid = await bcrypt.compare(
          payload.currentPassword,
          link.password,
        );

        if (!isCurrentPasswordValid) {
          return new ResponseBuilder()
            .withCode(ResponseCodeEnum.BAD_REQUEST)
            .withMessage(
              await this.i18n.translate(I18nErrorKeys.OLD_PASSWORD_INVALID),
            )
            .build();
        }
      }

      password = payload.newPassword;
    } else if (payload.currentPassword) {
      password = payload.currentPassword;
    }

    Object.assign(link, {
      ...payload,
      password: password,
      isUsePassword: password ? true : false,
    });

    delete (link as { currentPassword?: string }).currentPassword;
    delete (link as { newPassword?: string }).newPassword;

    const saved = await this.linkRepository.save(link);
    const response = plainToInstance(LinkResponseDto, saved, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        await this.i18n.translate(I18nMessageKeys.LINK_UPDATE_SUCCESS),
      )
      .build();
  }

  async deleteLink(id: string, userId: string) {
    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (link.userId !== userId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_PERMISSION_DENIED),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    await this.linkRepository.softDelete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(
        await this.i18n.translate(I18nMessageKeys.LINK_DELETE_SUCCESS),
      )
      .build();
  }

  async getById(id: string, userId: string) {
    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (link.userId !== userId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_PERMISSION_DENIED),
        ResponseCodeEnum.FORBIDDEN,
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

  async toggleActiveLink(id: string, userId: string) {
    const link = await this.linkRepository.findById(id);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (link.userId !== userId) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_PERMISSION_DENIED),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    if (link.status === LINK_STATUS.ACTIVE) {
      link.status = LINK_STATUS.DISABLED;
    } else if (link.status === LINK_STATUS.DISABLED) {
      link.status = LINK_STATUS.ACTIVE;
    } else {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.BAD_REQUEST),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

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

  async getByAlias(alias: string) {
    const link = await this.linkRepository.findByAlias(alias);
    if (!link) return null;
    return link;
  }

  async redirect(alias: string, req: Request) {
    const link = await this.getByAlias(alias);
    if (!link) return null;

    await this.linkRepository.incrementClicksCount(link.id, 1);

    const isValid =
      link.status === LINK_STATUS.ACTIVE &&
      (!link.expireAt || new Date() <= link.expireAt) &&
      (link.maxClicks == null || link.clicksCount < link.maxClicks);

    if (!isValid) return null;

    const clientInfo = this.getClientInfo(req);

    await this.clickRepository.createClick({
      linkId: link.id,
      ipAddress: clientInfo.ipAddress,
      device: clientInfo.device,
      browser: clientInfo.browser,
      referrer: clientInfo.referrer,
      country: clientInfo.country,
      countryCode: clientInfo.countryCode,
    });

    if (link.password) {
      return { link, requiresPassword: true };
    }

    await this.linkRepository.incrementSuccessfulAccessCount(link.id, 1);

    return { link, requiresPassword: false };
  }

  async verifyPassword(alias: string, passwordData: VerifyPasswordRequestDto) {
    const link = await this.getByAlias(alias);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (!link.password) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.BAD_REQUEST),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      passwordData.password,
      link.password,
    );

    if (!isPasswordValid) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.LINK_PASSWORD_INVALID),
        ResponseCodeEnum.UNAUTHORIZED,
      );
    }

    await this.linkRepository.incrementSuccessfulAccessCount(link.id, 1);

    const response = {
      originalUrl: link.originalUrl,
    };
    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async list(request: GetListLinkRequestDto, userId: string, isExport = false) {
    const { keyword, sort, filter, page, limit } = request;

    const { data, total } = await this.linkRepository.findWithFilters({
      keyword,
      filter,
      sort,
      page,
      limit,
      isExport,
      userId,
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

  async getTotalLinkPerStatus(userId: string) {
    const result = await this.linkRepository.getTotalLinkPerStatus(userId);

    const response = plainToInstance(GetTotalLinkPerStatusResponseDto, result, {
      excludeExtraneousValues: true,
    });

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async getLinkStatisticOverview(userId: string) {
    const result = await this.linkRepository.getLinkStatisticOverview(userId);

    const response = plainToInstance(
      GetLinkStatisticOverviewResponseDto,
      result,
      {
        excludeExtraneousValues: true,
      },
    );

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async getSingleLinkStatistic(userId: string, linkId: string) {
    const result = await this.linkRepository.getSingleLinkStatistic(
      userId,
      linkId,
    );

    const response = plainToInstance(
      GetSingleLinkStatisticResponseDto,
      result,
      {
        excludeExtraneousValues: true,
      },
    );

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async getClicksTrend(userId: string, query: AnalyticsQueryDto) {
    const { filter } = query;

    const result = await this.clickRepository.getClicksTrend({
      userId,
      filter,
    });

    const response = plainToInstance<TrendPointDto, unknown[]>(
      TrendPointDto,
      result,
      {
        excludeExtraneousValues: true,
      },
    );

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async getAllAnalyticsData(
    userId: string,
    query: AnalyticsQueryDto,
    linkId?: string,
  ) {
    const { filter } = query;

    const updatedFilter = linkId
      ? [...(filter || []), { column: 'linkId', text: linkId }]
      : filter;

    const [trend, countries, devices, browsers] = await Promise.all([
      this.clickRepository.getClicksTrend({
        userId,
        filter: updatedFilter,
      }),
      this.clickRepository.getTopCountries({
        userId,
        filter: updatedFilter,
      }),
      this.clickRepository.getDeviceBreakdown({
        userId,
        filter: updatedFilter,
      }),
      this.clickRepository.getBrowserBreakdown({
        userId,
        filter: updatedFilter,
      }),
    ]);

    const trendResponse = plainToInstance<TrendPointDto, unknown[]>(
      TrendPointDto,
      trend,
      {
        excludeExtraneousValues: true,
      },
    );

    const countriesResponse = plainToInstance<CountryCountDto, unknown[]>(
      CountryCountDto,
      countries,
      {
        excludeExtraneousValues: true,
      },
    );

    const devicesResponse = plainToInstance<DeviceCountDto, unknown[]>(
      DeviceCountDto,
      devices,
      {
        excludeExtraneousValues: true,
      },
    );

    const browsersResponse = plainToInstance<BrowserCountDto, unknown[]>(
      BrowserCountDto,
      browsers,
      {
        excludeExtraneousValues: true,
      },
    );

    const combinedResponse = {
      trend: trendResponse,
      countries: countriesResponse,
      devices: devicesResponse,
      browsers: browsersResponse,
    };

    return new ResponseBuilder(combinedResponse)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }
}
