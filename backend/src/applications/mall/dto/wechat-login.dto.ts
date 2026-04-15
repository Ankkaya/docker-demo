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
    description: '微信手机号授权 code，可选',
    required: false,
    example: '1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  phoneCode?: string;

  @ApiProperty({
    description: '微信昵称，可选',
    required: false,
    example: '微信用户',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({
    description: '微信头像地址，可选',
    required: false,
    example: 'https://thirdwx.qlogo.cn/mmopen/vi_32/xxx/132',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
