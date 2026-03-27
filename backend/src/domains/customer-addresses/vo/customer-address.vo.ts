import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerAddressVo {
  @ApiProperty({ description: '地址ID' })
  id: number;

  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '收货人' })
  receiverName: string;

  @ApiProperty({ description: '收货电话' })
  receiverPhone: string;

  @ApiPropertyOptional({ description: '省' })
  province?: string | null;

  @ApiPropertyOptional({ description: '市' })
  city?: string | null;

  @ApiPropertyOptional({ description: '区/县' })
  district?: string | null;

  @ApiProperty({ description: '详细地址' })
  address: string;

  @ApiProperty({ description: '完整地址' })
  fullAddress: string;

  @ApiPropertyOptional({ description: '邮编' })
  postalCode?: string | null;

  @ApiPropertyOptional({ description: '标签' })
  tag?: string | null;

  @ApiProperty({ description: '是否默认地址' })
  isDefault: boolean;

  @ApiProperty({ description: '排序值' })
  sort: number;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static buildFullAddress(entity: {
    province?: string | null;
    city?: string | null;
    district?: string | null;
    address: string;
  }) {
    return [entity.province, entity.city, entity.district, entity.address]
      .filter(Boolean)
      .join('');
  }

  static fromEntity(entity: any): CustomerAddressVo {
    return {
      id: entity.id,
      customerId: entity.customerId,
      receiverName: entity.receiverName,
      receiverPhone: entity.receiverPhone,
      province: entity.province ?? null,
      city: entity.city ?? null,
      district: entity.district ?? null,
      address: entity.address,
      fullAddress: this.buildFullAddress(entity),
      postalCode: entity.postalCode ?? null,
      tag: entity.tag ?? null,
      isDefault: entity.isDefault,
      sort: entity.sort,
      remark: entity.remark ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): CustomerAddressVo[] {
    return entities.map((entity) => this.fromEntity(entity));
  }
}
