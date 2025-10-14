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
import { ReferrerService } from './referrer.service';
import { CreateReferrerDto } from './dto/request/create-referrer.request.dto';
import { UpdateReferrerDto } from './dto/request/update-referrer.request.dto';
import { IdParamDto } from '@core/dto/params-id.request.dto';
import { mergePayload } from '@utils/common';
import { isEmpty } from 'lodash';
import { GetListReferrerRequestDto } from './dto/request/get-list-referrer.request.dto';
import { LoggedInRequest } from '@core/types/logged-in-request.type';

@ApiTags('Referrers')
@ApiBearerAuth('JWT-auth')
@Controller('referrers')
export class ReferrerController {
  constructor(private readonly referrerService: ReferrerService) {}

  @Post()
  @ApiOperation({ summary: 'Create referrer' })
  async createReferrer(
    @Body() payload: CreateReferrerDto,
    @Request() req: LoggedInRequest,
  ) {
    const { responseError, request } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.referrerService.createReferrer(
      request,
      req?.userId || '',
    );
  }

  @Get('/list')
  @ApiOperation({ summary: 'Get all referrers' })
  async getAllReferrers(
    @Query() query: GetListReferrerRequestDto,
    @Request() req: LoggedInRequest,
  ) {
    const { responseError, request } = query;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    if (request.page || request.limit) {
      return await this.referrerService.list(request, req?.userId || '');
    }

    return await this.referrerService.getAllReferrers(req?.userId || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get referrer by id' })
  async getReferrerById(
    @Param() params: IdParamDto,
    @Request() req: LoggedInRequest,
  ) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.referrerService.getReferrerById(
      request.id,
      req?.userId || '',
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update referrer by id' })
  async updateReferrer(
    @Param() params: IdParamDto,
    @Body() payload: UpdateReferrerDto,
    @Request() req: LoggedInRequest,
  ) {
    const merged = mergePayload(params, payload);
    const { request, responseError } = merged;
    if (!isEmpty(responseError)) return responseError;
    return await this.referrerService.updateReferrer(
      request.id,
      request,
      req?.userId || '',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete referrer by id' })
  async deleteReferrer(
    @Param() params: IdParamDto,
    @Request() req: LoggedInRequest,
  ) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.referrerService.deleteReferrer(
      request.id,
      req?.userId || '',
    );
  }
}
