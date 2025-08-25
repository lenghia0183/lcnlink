import { Injectable } from '@nestjs/common';
import { LinkRepository, ClickRepository } from '@database/repositories';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
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
import { I18nErrorKeys } from '@constant/i18n-keys.enum';
import { AppConfig } from '@config/config.type';
import { getPayloadFromRequest } from '@utils/common';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { LINK_STATUS } from './link.constant';
import { GetTotalLinkPerStatusResponseDto } from './dto/response/get-total-link-per-status.response.dto';
import { GetLinkStatisticOverviewResponseDto } from './dto/response/get-link-statistic-overview.response.dto';

@Injectable()
export class LinkService {
  constructor(
    private readonly i18n: I18nService,
    private readonly linkRepository: LinkRepository,
    private readonly clickRepository: ClickRepository,
    private readonly configService: ConfigService,
  ) {}

  private generateAlias(length = 10) {
    return uuidv4().replace(/-/g, '').slice(0, length);
  }

  private getClientInfo(req: Request) {
    const ipRaw =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown';

    const ip = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw;
    const userAgent = req.get('user-agent') || '';
    const referrer = req.get('referer') || '';

    // Simple device/browser detection from user-agent
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
    };
  }

  async createLink(data: CreateLinkRequestDto) {
    let alias = data.alias;
    if (alias) {
      const exists = await this.linkRepository.findByAlias(alias);

      if (exists) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage('Alias already exists')
          .build();
      }
    } else {
      alias = this.generateAlias(10);
    }

    const appConfig = this.configService.get<AppConfig>('app');
    const frontendUrl =
      (appConfig && appConfig.frontendUrl) || 'http://localhost:3000';
    const shortedUrl = `${frontendUrl.replace(/\/$/, '')}/r/${alias}`;

    // Hash password if provided
    let hashedPassword: string | undefined = undefined;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    const saved = await this.linkRepository.createLink({
      originalUrl: data.originalUrl,
      alias,
      shortedUrl,
      password: hashedPassword,
      userId: data.userId,
      maxClicks: data.maxClicks,
      expireAt: data.expireAt ? new Date(String(data.expireAt)) : undefined,
      isUsePassword: !!hashedPassword,
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
          .withMessage('Alias already exists')
          .build();
      }

      const appConfig = this.configService.get<AppConfig>('app');
      const frontendUrl =
        (appConfig && appConfig.frontendUrl) || 'http://localhost:3000';

      const newShortedUrl = `${frontendUrl.replace(/\/$/, '')}/r/${payload.alias}`;
      link.shortedUrl = newShortedUrl;
    }

    // Hash password if provided
    if (payload.password) {
      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(payload.password, salt);
    }

    Object.assign(link, { ...payload, isUsePassword: !!payload.password });

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

  async deleteLink(id: string, userId: string) {
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

    await this.linkRepository.softDelete(id);

    return (
      await new ResponseBuilder().withCodeI18n(
        ResponseCodeEnum.SUCCESS,
        this.i18n,
      )
    ).build();
  }

  async getById(id: string, userId: string) {
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

  async toggleActiveLink(id: string, userId: string) {
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

  async handleRedirect(alias: string, req: Request) {
    const link = await this.getByAlias(alias);
    console.log('link', link);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    // Check if link is active
    if (!(link.status === LINK_STATUS.ACTIVE)) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FORBIDDEN),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    // Check if link has expired
    if (link.expireAt && new Date() > link.expireAt) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FORBIDDEN),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    // Check if max clicks reached
    if (link.maxClicks && link.clicksCount >= link.maxClicks) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.FORBIDDEN),
        ResponseCodeEnum.FORBIDDEN,
      );
    }

    // Always increment clicks count
    await this.linkRepository.incrementClicksCount(link.id, 1);

    // Get client information
    const clientInfo = this.getClientInfo(req);

    // Record click
    await this.clickRepository.createClick({
      linkId: link.id,
      ipAddress: clientInfo.ipAddress,
      device: clientInfo.device,
      browser: clientInfo.browser,
      referrer: clientInfo.referrer,
    });

    // If link has password, return link without incrementing successful access
    if (link.password) {
      return { link, requiresPassword: true };
    }

    // If no password, increment successful access count
    await this.linkRepository.incrementSuccessfulAccessCount(link.id, 1);

    return { link, requiresPassword: false };
  }

  async verifyPassword(alias: string, passwordData: VerifyPasswordRequestDto) {
    const link = await this.getByAlias(alias);
    if (!link) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.NOT_FOUND),
        ResponseCodeEnum.NOT_FOUND,
      );
    }

    if (!link.password) {
      throw new BusinessException(
        await this.i18n.translate(I18nErrorKeys.BAD_REQUEST),
        ResponseCodeEnum.BAD_REQUEST,
      );
    }

    // Verify password
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

    // Password is correct, increment successful access count
    await this.linkRepository.incrementSuccessfulAccessCount(link.id, 1);

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
}
