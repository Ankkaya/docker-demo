import { ApiProperty } from '@nestjs/swagger';
import { CategoryVo } from '@/categories/vo';
import { BrandVo } from '@/brands/vo';
import { UnitVo } from '@/units/vo';

export class ProductVo {
  @ApiProperty({ description: '商品ID' })
  id: number;

  @ApiProperty({ description: '商品名称' })
  name: string;

  @ApiProperty({ description: 'SPU编码' })
  spuCode: string;

  @ApiProperty({ description: '分类ID' })
  categoryId: number;

  @ApiProperty({ description: '品牌ID', nullable: true })
  brandId: number | null;

  @ApiProperty({ description: '单位ID' })
  unitId: number;

  @ApiProperty({ description: '商品描述', nullable: true })
  description: string | null;

  @ApiProperty({ description: '商品详情（富文本HTML）', nullable: true })
  detail: string | null;

  @ApiProperty({ description: '商品主图', nullable: true })
  mainImage: string | null;

  @ApiProperty({ description: '商品图片列表', type: [String], nullable: true })
  images: string[] | null;

  @ApiProperty({ description: '规格模板', type: 'object', additionalProperties: true, nullable: true })
  specTemplate: any | null;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '是否在商城上架' })
  mallEnabled: boolean;

  @ApiProperty({ description: '总可用库存', required: false })
  totalAvailable?: number;

  @ApiProperty({ description: '是否有库存', required: false })
  hasStock?: boolean;

  @ApiProperty({
    description: '商城扩展信息',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  mallInfo?: {
    name: string | null;
    description: string | null;
    detail: string | null;
    mainImage: string | null;
    images: string[];
    isHot: boolean;
    hotSort: number;
    hotLabel: string | null;
  } | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): ProductVo {
    return {
      id: entity.id,
      name: entity.name,
      spuCode: entity.spuCode,
      categoryId: entity.categoryId,
      brandId: entity.brandId,
      unitId: entity.unitId,
      description: entity.description,
      detail: entity.detail,
      mainImage: entity.mainImage,
      images: entity.images,
      specTemplate: entity.specTemplate,
      isEnabled: entity.isEnabled,
      mallEnabled: entity.mallEnabled,
      totalAvailable: entity.totalAvailable,
      hasStock: entity.hasStock,
      mallInfo: entity.mallInfo
        ? {
            name: entity.mallInfo.name ?? null,
            description: entity.mallInfo.description ?? null,
            detail: entity.mallInfo.detail ?? null,
            mainImage: entity.mallInfo.mainImage ?? null,
            images: Array.isArray(entity.mallInfo.images) ? entity.mallInfo.images : [],
            isHot: entity.mallInfo.isHot ?? false,
            hotSort: entity.mallInfo.hotSort ?? 0,
            hotLabel: entity.mallInfo.hotLabel ?? null,
          }
        : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): ProductVo[] {
    return entities.map(e => ProductVo.fromEntity(e));
  }
}

export class ProductWithRelationsVo extends ProductVo {
  @ApiProperty({ description: '分类信息', type: CategoryVo, nullable: true })
  category?: CategoryVo | null;

  @ApiProperty({ description: '品牌信息', type: BrandVo, nullable: true })
  brand?: BrandVo | null;

  @ApiProperty({ description: '单位信息', type: UnitVo, nullable: true })
  unit?: UnitVo | null;

  @ApiProperty({
    description: 'SKU列表',
    type: 'array',
    required: false,
    items: { type: 'object', additionalProperties: true },
  })
  skus?: any[];

  static fromEntity(entity: any): ProductWithRelationsVo {
    return {
      ...ProductVo.fromEntity(entity),
      category: entity.category ? CategoryVo.fromEntity(entity.category) : null,
      brand: entity.brand ? BrandVo.fromEntity(entity.brand) : null,
      unit: entity.unit ? UnitVo.fromEntity(entity.unit) : null,
      skus: entity.skus ?? [],
    };
  }

  static fromEntities(entities: any[]): ProductWithRelationsVo[] {
    return entities.map(e => ProductWithRelationsVo.fromEntity(e));
  }
}
