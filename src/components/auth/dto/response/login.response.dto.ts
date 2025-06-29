import { USER_GENDER_ENUM } from '@components/user/user.constant';
import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LoginResponseDTO extends BaseDto<LoginResponseDTO> {
  @ApiProperty({ description: 'fullname', example: 'kamil mysliwiec' })
  @Expose()
  fullname: string;

  @ApiProperty({ description: 'fullname', example: 'nghialc@gmail.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'phone', example: '0966859061' })
  @Expose()
  phone: string;

  @ApiProperty({ description: 'gender', example: 'female' })
  @Expose()
  gender: USER_GENDER_ENUM;

  @ApiProperty({ description: 'date of birth', example: '01/08/2003' })
  @Expose()
  dateOfBirth: Date;

  @ApiProperty({ description: 'refresh token', example: '1231233' })
  @Expose()
  refreshToken: string;

  @ApiProperty({ description: 'access token', example: '1231233' })
  @Expose()
  accessToken: string;
}
