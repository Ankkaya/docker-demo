import { ApiProperty } from '@nestjs/swagger';

export class SupplierVo {
  @ApiProperty({ description: '供应商ID' })
  id: number;

  @ApiProperty({ description: '供应商名称' })
  name: string;

  @ApiProperty({ description: '供应商编码' })
  code: string;

  @ApiProperty({ description: '联系人', nullable: true })
  contact: string | null;

  @ApiProperty({ description: '联系电话', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '邮箱', nullable: true })
  email: string | null;

  @ApiProperty({ description: '地址', nullable: true })
  address: string | null;

  @ApiProperty({ description: '开户行', nullable: true })
  bankName: string | null;

  @ApiProperty({ description: '银行账号', nullable: true })
  bankAccount: string | null;

  @ApiProperty({ description: '税号', nullable: true })
  taxNo: string | null;

  @ApiProperty({ description: '信用额度', nullable: true, type: 'string' })
  creditLimit: string | null;

  @ApiProperty({ description: '账期(天)' })
  period: number;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '备注', nullable: true })
  remark: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): SupplierVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      contact: entity.contact,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      bankName: entity.bankName,
      bankAccount: entity.bankAccount,
      taxNo: entity.taxNo,
      creditLimit: entity.creditLimit ? entity.creditLimit.toString() : null,
      period: entity.period,
      isEnabled: entity.isEnabled,
      remark: entity.remark,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): SupplierVo[] {
    return entities.map(e => SupplierVo.fromEntity(e));
  }
}
