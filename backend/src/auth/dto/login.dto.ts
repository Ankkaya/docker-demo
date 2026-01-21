import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin',
    description: '用户名',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'password123',
    description: '用户密码',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
