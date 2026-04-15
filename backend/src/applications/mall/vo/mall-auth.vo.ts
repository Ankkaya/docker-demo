import { ApiProperty } from '@nestjs/swagger';
import { UserVo } from '@/users/vo';

export class MallTokenPairVo {
  @ApiProperty({ description: 'JWT token' })
  token: string;

  @ApiProperty({ description: '刷新 token' })
  refreshToken: string;
}

export class MallCurrentCustomerVo {
  @ApiProperty({ description: '客户ID' })
  id: number;

  @ApiProperty({ description: '客户名称' })
  name: string;

  @ApiProperty({ description: '手机号', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '地址', nullable: true })
  address: string | null;

  @ApiProperty({ description: '余额账户ID', nullable: true })
  balanceAccountId: number | null;

  @ApiProperty({ description: '可用余额', nullable: true, type: String })
  availableBalance: string | null;
}

export class MallCurrentUserVo extends UserVo {
  @ApiProperty({ description: '手机号', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '关联客户信息', type: MallCurrentCustomerVo, nullable: true })
  customer: MallCurrentCustomerVo | null;
}

export class MallWechatLoginVo extends MallTokenPairVo {
  @ApiProperty({ description: '用户信息', type: MallCurrentUserVo })
  user: MallCurrentUserVo;

  @ApiProperty({ description: '是否已完成资料设置' })
  profileCompleted: boolean;
}
