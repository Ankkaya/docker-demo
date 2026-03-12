import { ApiProperty } from '@nestjs/swagger';
import { ProductSkuWithProductVo } from '@/products/vo';
import { WarehouseVo } from '@/warehouses/vo';

/**
 * 库存记录基础 VO
 */
export class InventoryVo {
  @ApiProperty({ description: '库存ID' })
  id: number;

  @ApiProperty({ description: 'SKU ID' })
  skuId: number;

  @ApiProperty({ description: '仓库ID' })
  warehouseId: number;

  @ApiProperty({ description: '实际库存数量' })
  quantity: number;

  @ApiProperty({ description: '锁定库存数量' })
  locked: number;

  @ApiProperty({ description: '可用库存数量' })
  available: number;

  @ApiProperty({ description: '安全库存下限' })
  minStock: number;

  @ApiProperty({ description: '库存上限' })
  maxStock: number;

  @ApiProperty({ description: '库位编码', nullable: true })
  location: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): InventoryVo {
    return {
      id: entity.id,
      skuId: entity.skuId,
      warehouseId: entity.warehouseId,
      quantity: entity.quantity,
      locked: entity.locked,
      available: entity.available,
      minStock: entity.minStock,
      maxStock: entity.maxStock,
      location: entity.location,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): InventoryVo[] {
    return entities.map(e => InventoryVo.fromEntity(e));
  }
}

/**
 * 库存记录 VO - 包含 SKU 信息（含商品基本信息）
 */
export class InventoryWithSkuVo extends InventoryVo {
  @ApiProperty({ description: 'SKU信息', type: ProductSkuWithProductVo, nullable: true })
  sku: ProductSkuWithProductVo | null;

  static fromEntity(entity: any): InventoryWithSkuVo {
    return {
      ...InventoryVo.fromEntity(entity),
      sku: entity.sku ? ProductSkuWithProductVo.fromEntity(entity.sku) : null,
    };
  }

  static fromEntities(entities: any[]): InventoryWithSkuVo[] {
    return entities.map(e => InventoryWithSkuVo.fromEntity(e));
  }
}

/**
 * 库存记录 VO - 包含仓库信息
 */
export class InventoryWithWarehouseVo extends InventoryVo {
  @ApiProperty({ description: '仓库信息', type: WarehouseVo, nullable: true })
  warehouse: WarehouseVo | null;

  static fromEntity(entity: any): InventoryWithWarehouseVo {
    return {
      ...InventoryVo.fromEntity(entity),
      warehouse: entity.warehouse ? WarehouseVo.fromEntity(entity.warehouse) : null,
    };
  }

  static fromEntities(entities: any[]): InventoryWithWarehouseVo[] {
    return entities.map(e => InventoryWithWarehouseVo.fromEntity(e));
  }
}

/**
 * 库存记录完整 VO - 同时包含 SKU 和仓库完整信息
 */
export class InventoryFullVo extends InventoryVo {
  @ApiProperty({ description: 'SKU信息', type: ProductSkuWithProductVo, nullable: true })
  sku: ProductSkuWithProductVo | null;

  @ApiProperty({ description: '仓库信息', type: WarehouseVo, nullable: true })
  warehouse: WarehouseVo | null;

  static fromEntity(entity: any): InventoryFullVo {
    return {
      ...InventoryVo.fromEntity(entity),
      sku: entity.sku ? ProductSkuWithProductVo.fromEntity(entity.sku) : null,
      warehouse: entity.warehouse ? WarehouseVo.fromEntity(entity.warehouse) : null,
    };
  }

  static fromEntities(entities: any[]): InventoryFullVo[] {
    return entities.map(e => InventoryFullVo.fromEntity(e));
  }
}
