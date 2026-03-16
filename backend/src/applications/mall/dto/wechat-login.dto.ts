import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({
    description: '微信小程序 wx.login 返回的 code',
    example: '081Z2b000YlXYZ1abc000abcde123456',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: '微信昵称，可选',
    required: false,
    example: '微信用户',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}
