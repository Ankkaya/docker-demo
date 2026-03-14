import { ApiProperty } from '@nestjs/swagger';

export class WarehouseVo {
  @ApiProperty({ description: '仓库ID' })
  id: number;

  @ApiProperty({ description: '仓库名称' })
  name: string;

  @ApiProperty({ description: '仓库编码' })
  code: string;

  @ApiProperty({ description: '地址', nullable: true })
  address: string | null;

  @ApiProperty({ description: '联系人', nullable: true })
  contact: string | null;

  @ApiProperty({ description: '联系电话', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '是否默认仓库' })
  isDefault: boolean;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): WarehouseVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      address: entity.address,
      contact: entity.contact,
      phone: entity.phone,
      isDefault: entity.isDefault,
      isEnabled: entity.isEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): WarehouseVo[] {
    return entities.map(e => WarehouseVo.fromEntity(e));
  }
}
