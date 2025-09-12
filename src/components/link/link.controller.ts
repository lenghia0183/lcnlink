import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LinkService } from './link.service';
import { CreateLinkRequestDto } from './dto/request/create-link.request.dto';
import { UpdateLinkRequestDto } from './dto/request/update-link.request.dto';
import { GetListLinkRequestDto } from './dto/request/get-list-link.request.dto';
import { IdParamDto } from '@core/dto/params-id.request.dto';
import { mergePayload } from '@utils/common';
import { isEmpty } from 'lodash';

import { LoggedInRequest } from '@core/types/logged-in-request.type';
import { AnalyticsQueryDto } from './dto/request/analytics.query.dto';
import { Public } from '@core/decorators/public.decorator';
import { VerifyPasswordRequestDto } from './dto/request/verify-password.request.dto';

@ApiTags('Links')
@ApiBearerAuth('JWT-auth')
@Controller('links')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create short link' })
  async createLink(
    @Body() payload: CreateLinkRequestDto,
    @Request() req: LoggedInRequest,
  ) {
    const { responseError, request } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.linkService.createLink(request, req?.userId || null);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Get list of links' })
  async getList(
    @Query() query: GetListLinkRequestDto,
    @Request() req: LoggedInRequest,
  ) {
    const { responseError, request } = query;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.linkService.list(request, req?.userId || '');
  }

  @Get('/total-link-per-status')
  async getTotalLinkPerStatus(@Request() req: LoggedInRequest) {
    return await this.linkService.getTotalLinkPerStatus(req?.userId || '');
  }

  @Get('/statistic-overview')
  async getLinkStatisticOverview(@Request() req: LoggedInRequest) {
    return await this.linkService.getLinkStatisticOverview(req?.userId || '');
  }

  @Get('/analytics/trend')
  async getClicksTrend(
    @Request() req: LoggedInRequest,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { request, responseError } = query;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.linkService.getClicksTrend(req?.userId || '', request);
  }

  @Get('/analytics/countries')
  async getTopCountries(
    @Request() req: LoggedInRequest,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { request, responseError } = query;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.linkService.getTopCountries(req?.userId || '', request);
  }

  @Get('/analytics/devices')
  async getDeviceBreakdown(
    @Request() req: LoggedInRequest,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { request, responseError } = query;

    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.linkService.getDeviceBreakdown(
      req?.userId || '',
      request,
    );
  }

  @Get('/analytics/browsers')
  async getBrowserBreakdown(
    @Request() req: LoggedInRequest,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { request, responseError } = query;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.linkService.getBrowserBreakdown(
      req?.userId || '',
      request,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get link detail by id' })
  async getById(@Param() params: IdParamDto) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.linkService.getById(request.id, request?.userId || '');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update link by id' })
  async updateLink(
    @Param() params: IdParamDto,
    @Body() payload: UpdateLinkRequestDto,
  ) {
    const merged = mergePayload(params, payload);
    const { request, responseError } = merged;
    if (!isEmpty(responseError)) return responseError;
    return await this.linkService.updateLink(
      request.id,
      request,
      request?.userId || '',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete link by id (soft delete)' })
  async deleteLink(@Param() params: IdParamDto) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.linkService.deleteLink(request.id, request?.userId || '');
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle active/inactive for a link' })
  async toggleActive(@Param() params: IdParamDto) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.linkService.toggleActiveLink(
      request.id,
      request?.userId || '',
    );
  }

  @Public()
  @Post('/:alias/verify-password')
  @ApiOperation({ summary: 'Verify password for protected link' })
  async verifyPassword(
    @Param('alias') alias: string,
    @Body() payload: VerifyPasswordRequestDto,
  ) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.linkService.verifyPassword(alias, request);
  }
}
