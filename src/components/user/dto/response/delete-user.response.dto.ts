import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeleteUserResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User deleted successfully',
  })
  @Expose()
  message: string;
}
