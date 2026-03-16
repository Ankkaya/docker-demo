import { ApiProperty } from '@nestjs/swagger';
import { UserVo } from '@/users/vo';

export class MallWechatLoginVo {
  @ApiProperty({ description: 'JWT token' })
  token: string;

  @ApiProperty({ description: '用户信息', type: UserVo })
  user: UserVo;
}
