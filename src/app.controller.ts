import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '@core/decorators/public.decorator';

@ApiTags('Hệ thống')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái hệ thống',
    description: 'Endpoint để kiểm tra xem API có hoạt động hay không',
  })
  @ApiResponse({
    status: 200,
    description: 'Hệ thống hoạt động bình thường',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
