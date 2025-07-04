import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ToggleLockUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Expose()
  fullname: string;

  @ApiProperty({
    description: 'User lock status',
    example: true,
  })
  @Expose()
  isLocked: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'User lock status updated successfully',
  })
  @Expose()
  message: string;
}
