import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MallRefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
  })
  @IsString()
  refreshToken: string;
}
