import { Controller, Get, Param, Body, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LinkService } from './link.service';
import { Response, Request } from 'express';

import { Public } from '@core/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/config.type';

@ApiTags('Public Links')
@Controller()
export class PublicLinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('/r/:alias')
  @ApiOperation({ summary: 'Redirect by alias (public)' })
  async redirect(
    @Param('alias') alias: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const appConfig = this.configService.get<AppConfig>('app');
    const frontendUrl =
      (appConfig && appConfig.frontendUrl) || 'http://localhost:3000';
    const result = await this.linkService.redirect(alias, req);

    if (result === null) {
      return res.redirect(`${frontendUrl}/not-found`);
    }

    if (result.requiresPassword) {
      return res.redirect(
        `${frontendUrl}/passkey?alias=${alias}&shortedUrl=${result.link.shortedUrl}`,
      );
    }

    return res.redirect(result.link.originalUrl);
  }
}
