import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { BaseDto } from './base.request.dto';

export class IdParamDto extends BaseDto<IdParamDto> {
  @ApiProperty()
  @IsNotEmpty()
  id: string;
}
