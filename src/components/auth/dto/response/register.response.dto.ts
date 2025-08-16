import { USER_GENDER_ENUM } from '@components/user/user.constant';
import { BaseDto } from '@core/dto/base.request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RegisterResponseDTO extends BaseDto<RegisterResponseDTO> {
  @ApiProperty({
    description: 'User ID',
    example: 'c9b510c6-15d5-43cd-ae9a-d0f85f3b3944',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Full name', example: 'le cong nghia' })
  @Expose()
  fullname: string;

  @ApiProperty({
    description: 'Email address',
    example: 'lenghia0108@gmail.com',
  })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+84912345678' })
  @Expose()
  phone: string;

  @ApiProperty({ description: 'User role', example: 0 })
  @Expose()
  role: number;

  @ApiProperty({ description: 'Gender', example: 0 })
  @Expose()
  gender: USER_GENDER_ENUM;

  @ApiProperty({
    description: 'Date of birth',
    example: '2003-08-01',
    nullable: true,
  })
  @Expose()
  dateOfBirth: Date | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  @Expose()
  avatar: string | null;

  @ApiProperty({
    description: 'Account creation date',
    example: '2025-07-11T20:17:12.432Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2025-08-15T08:05:37.190Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Account status (1 = active, 0 = inactive)',
    example: 1,
  })
  @Expose()
  isActive: number;

  @ApiProperty({
    description: 'Is account locked (1 = locked, 0 = unlocked)',
    example: 0,
  })
  @Expose()
  isLocked: number;
}
