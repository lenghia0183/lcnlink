import {
  IsEnum,
  IsString,
  MaxLength,
  IsOptional,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import {
  USER_ROLE_ENUM,
  USER_GENDER_ENUM,
} from '@components/user/user.constant';
import { BaseDto } from '@core/dto/base.request.dto';

export class UpdateUserRequestDto extends BaseDto<UpdateUserRequestDto> {
  @ApiProperty({ description: 'fullname', example: 'kamil mysliwiec' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(50)
  fullname: string;

  @ApiProperty({ description: 'email', example: 'kamil@mysliwiec' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'role', example: 1 })
  @IsEnum(USER_ROLE_ENUM)
  @IsOptional()
  @IsNotEmpty()
  role: USER_ROLE_ENUM;

  @ApiProperty({ description: 'gender', example: 1 })
  @IsEnum(USER_GENDER_ENUM)
  @IsOptional()
  @IsNotEmpty()
  gender: USER_GENDER_ENUM;

  @ApiProperty({ description: 'phone', example: '0123456789' })
  @Length(10)
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  phone: string;
}
