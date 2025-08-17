import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LinkService } from './link.service';
import { CreateLinkRequestDto } from './dto/request/create-link.request.dto';
import { UpdateLinkRequestDto } from './dto/request/update-link.request.dto';
import { GetListLinkRequestDto } from './dto/request/get-list-link.request.dto';
import { IdParamDto } from '@core/dto/params-id.request.dto';
import { mergePayload } from '@utils/common';
import { Response } from 'express';
import { isEmpty } from 'lodash';

@ApiTags('Links')
@ApiBearerAuth('JWT-auth')
@Controller('links')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Post()
  @ApiOperation({ summary: 'Create short link' })
  async createLink(@Body() payload: CreateLinkRequestDto) {
    const { responseError, request } = payload;

    if (!isEmpty(responseError)) {
      return responseError;
    }

    return await this.linkService.createLink(request);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Get list of links' })
  async getList(@Query() query: GetListLinkRequestDto) {
    const { responseError, request } = query;
    if (!isEmpty(responseError)) {
      return responseError;
    }
    return await this.linkService.list(request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get link detail by id' })
  async getById(@Param() params: IdParamDto) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.linkService.getById(request.id);
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
    return await this.linkService.deleteLink(request.id);
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle active/inactive for a link' })
  async toggleActive(@Param() params: IdParamDto) {
    const { request, responseError } = params;
    if (!isEmpty(responseError)) return responseError;
    return await this.linkService.toggleActiveLink(request.id);
  }

  // public redirect by alias
  @Get('/r/:alias')
  @HttpCode(302)
  @ApiOperation({ summary: 'Redirect by alias (public)' })
  async redirect(@Param('alias') alias: string, @Res() res: Response) {
    const link = await this.linkService.handleRedirect(alias);
    if (!link) return res.status(404).send('Not found');

    return res.redirect(link.originalUrl);
  }
}
