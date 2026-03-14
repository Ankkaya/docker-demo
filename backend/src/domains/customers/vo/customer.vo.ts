import { ApiProperty } from '@nestjs/swagger';

export class CustomerVo {
  @ApiProperty({ description: '客户ID' })
  id: number;

  @ApiProperty({ description: '客户名称' })
  name: string;

  @ApiProperty({ description: '客户编码' })
  code: string;

  @ApiProperty({ description: '客户类型', enum: ['INDIVIDUAL', 'COMPANY'] })
  type: string;

  @ApiProperty({ description: '联系人', nullable: true })
  contact: string | null;

  @ApiProperty({ description: '联系电话', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '邮箱', nullable: true })
  email: string | null;

  @ApiProperty({ description: '地址', nullable: true })
  address: string | null;

  @ApiProperty({ description: '信用额度', nullable: true, type: 'string' })
  creditLimit: string | null;

  @ApiProperty({ description: '账期(天)' })
  period: number;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '备注', nullable: true })
  remark: string | null;

  @ApiProperty({ description: '关联用户ID', nullable: true })
  userId: number | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): CustomerVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      contact: entity.contact,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      creditLimit: entity.creditLimit ? entity.creditLimit.toString() : null,
      period: entity.period,
      isEnabled: entity.isEnabled,
      remark: entity.remark,
      userId: entity.userId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): CustomerVo[] {
    return entities.map(e => CustomerVo.fromEntity(e));
  }
}

export class CustomerUserVo {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '邮箱', nullable: true })
  email: string | null;

  static fromEntity(entity: any): CustomerUserVo {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
    };
  }

  static fromEntities(entities: any[]): CustomerUserVo[] {
    return entities.map(e => CustomerUserVo.fromEntity(e));
  }
}

export class CustomerWithUserVo extends CustomerVo {
  @ApiProperty({ description: '关联用户', type: CustomerUserVo, nullable: true })
  user: CustomerUserVo | null;

  static fromEntity(entity: any): CustomerWithUserVo {
    return {
      ...CustomerVo.fromEntity(entity),
      user: entity.user ? CustomerUserVo.fromEntity(entity.user) : null,
    };
  }
}
