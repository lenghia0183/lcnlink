import { Controller, Get, Post, Param, Body, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LinkService } from './link.service';
import { VerifyPasswordRequestDto } from './dto/request/verify-password.request.dto';
import { Response, Request } from 'express';
import { isEmpty } from 'lodash';
import { Public } from '@core/decorators/public.decorator';

@ApiTags('Public Links')
@Controller()
export class PublicLinkController {
  constructor(private readonly linkService: LinkService) {}

  // public redirect by alias (without API prefix)
  @Public()
  @Get('/r/:alias')
  @ApiOperation({ summary: 'Redirect by alias (public)' })
  async redirect(
    @Param('alias') alias: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('alias', alias);
    const result = await this.linkService.handleRedirect(alias, req);

    if (result.requiresPassword) {
      // Redirect to password form page
      return res.redirect(`/p/${alias}`);
    }

    return res.redirect(result.link.originalUrl);
  }

  // verify password for protected link (without API prefix)
  @Public()
  @Post('/r/:alias/verify-password')
  @ApiOperation({ summary: 'Verify password for protected link' })
  async verifyPassword(
    @Param('alias') alias: string,
    @Body() payload: VerifyPasswordRequestDto,
    @Res() res: Response,
  ) {
    const { request, responseError } = payload;
    if (!isEmpty(responseError)) {
      return responseError;
    }

    const link = await this.linkService.verifyPassword(alias, request);

    // Return JSON response with redirect URL
    return res.json({
      success: true,
      redirectUrl: link.originalUrl,
    });
  }

  // Show password form page (without API prefix)
  @Public()
  @Get('/p/:alias')
  @ApiOperation({ summary: 'Show password form page' })
  async showPasswordForm(@Param('alias') alias: string, @Res() res: Response) {
    // Check if link exists and has password
    const link = await this.linkService.getByAlias(alias);
    if (!link) {
      return res.status(404).send('Link không tồn tại');
    }

    if (!link.password) {
      // If no password, redirect directly
      return res.redirect(link.originalUrl);
    }

    // Return password form HTML page
    return res.sendFile('password-form.html', { root: './public/pages' });
  }
}
