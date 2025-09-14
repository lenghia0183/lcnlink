import { IS_2FA_ENUM } from '@components/user/user.constant';

import { User } from '@database/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class OAuthValidationResponseDto {
  @ApiProperty()
  @IsBoolean()
  success: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requires2FA?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otpToken?: string;

  @ApiProperty({ required: false, type: () => User })
  @IsOptional()
  userData?: User;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsOptional()
  fullname?: string;

  @ApiProperty({ required: false, enum: ['google', 'facebook'] })
  @IsOptional()
  @IsEnum(['google', 'facebook'])
  oauthProvider?: 'google' | 'facebook';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oauthProviderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ required: false, enum: IS_2FA_ENUM })
  @IsOptional()
  @IsEnum(IS_2FA_ENUM)
  isEnable2FA?: IS_2FA_ENUM;
}
