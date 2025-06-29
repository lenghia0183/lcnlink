import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { BaseDto } from './base.request.dto';

export class IdParamDto extends BaseDto<IdParamDto> {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
