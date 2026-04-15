import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class MallLoginDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138000',
  })
  @IsString()
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({
    description: '登录密码',
    example: '123456',
  })
  @IsString()
  @Length(6, 50)
  password: string;
}
