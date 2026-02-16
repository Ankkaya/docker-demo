import { ApiProperty } from '@nestjs/swagger';
import { SkuStatus } from '@prisma/client';
import { ProductVo } from './product.vo';
import { InventoryVo } from '@/inventories/vo';

export class ProductSkuVo {
  @ApiProperty({ description: 'SKU ID' })
  id: number;

  @ApiProperty({ description: 'SKU编码' })
  skuCode: string;

  @ApiProperty({ description: '商品ID' })
  productId: number;

  @ApiProperty({ description: '规格组合', type: 'object', additionalProperties: true })
  specs: any;

  @ApiProperty({ description: '成本价', nullable: true })
  costPrice: number | null;

  @ApiProperty({ description: '销售价', nullable: true })
  salePrice: number | null;

  @ApiProperty({ description: '市场价', nullable: true })
  marketPrice: number | null;

  @ApiProperty({ description: 'SKU图片', nullable: true })
  image: string | null;

  @ApiProperty({ description: '条形码', nullable: true })
  barcode: string | null;

  @ApiProperty({ description: '重量(kg)', nullable: true })
  weight: number | null;

  @ApiProperty({ description: '体积(m³)', nullable: true })
  volume: number | null;

  @ApiProperty({ description: '是否默认SKU' })
  isDefault: boolean;

  @ApiProperty({ description: '排序号' })
  sort: number;

  @ApiProperty({ description: 'SKU状态', enum: SkuStatus })
  status: SkuStatus;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): ProductSkuVo {
    return {
      id: entity.id,
      skuCode: entity.skuCode,
      productId: entity.productId,
      specs: entity.specs,
      costPrice: entity.costPrice,
      salePrice: entity.salePrice,
      marketPrice: entity.marketPrice,
      image: entity.image,
      barcode: entity.barcode,
      weight: entity.weight,
      volume: entity.volume,
      isDefault: entity.isDefault,
      sort: entity.sort,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): ProductSkuVo[] {
    return entities.map(e => ProductSkuVo.fromEntity(e));
  }
}

export class ProductSkuWithProductVo extends ProductSkuVo {
  @ApiProperty({ description: '商品信息', type: ProductVo, nullable: true })
  product?: ProductVo | null;

  static fromEntity(entity: any): ProductSkuWithProductVo {
    return {
      ...ProductSkuVo.fromEntity(entity),
      product: entity.product ? ProductVo.fromEntity(entity.product) : null,
    };
  }

  static fromEntities(entities: any[]): ProductSkuWithProductVo[] {
    return entities.map(e => ProductSkuWithProductVo.fromEntity(e));
  }
}

export class ProductSkuWithInventoriesVo extends ProductSkuVo {
  @ApiProperty({ description: '库存列表', type: [InventoryVo] })
  inventories: InventoryVo[];

  static fromEntity(entity: any): ProductSkuWithInventoriesVo {
    return {
      ...ProductSkuVo.fromEntity(entity),
      inventories: entity.inventories ? InventoryVo.fromEntities(entity.inventories) : [],
    };
  }

  static fromEntities(entities: any[]): ProductSkuWithInventoriesVo[] {
    return entities.map(e => ProductSkuWithInventoriesVo.fromEntity(e));
  }
}
