import { USER_GENDER_ENUM } from '@components/user/user.constant';
import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterRequestDTO extends BaseDto<RegisterRequestDTO> {
  @ApiProperty({ description: 'fullname', example: 'kamil mysliwiec' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  fullname: string;

  @ApiProperty({ description: 'fullname', example: 'nghialc@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'password', example: 'abcdxyz' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  password: string;

  @ApiProperty({ description: 'phone', example: '0966859061' })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ description: 'gender', example: 'female' })
  @IsNotEmpty()
  @IsEnum(USER_GENDER_ENUM)
  gender: USER_GENDER_ENUM;

  @ApiProperty({ description: 'date of birth', example: '01/08/2003' })
  @IsNotEmpty()
  dateOfBirth: Date;
}
