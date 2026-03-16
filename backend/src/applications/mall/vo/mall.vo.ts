import { ApiProperty } from '@nestjs/swagger';
import { BrandVo } from '@/brands/vo';
import { BannerVo } from '@/domains/banners/vo/banner.vo';
import { ProductWithRelationsVo } from '@/products/vo';

export class MallProductSkuCardVo {
  @ApiProperty({ description: 'SKU ID' })
  id: number;

  @ApiProperty({ description: 'SKU编码' })
  skuCode: string;

  @ApiProperty({ description: '销售价', nullable: true })
  salePrice: number | null;

  @ApiProperty({ description: '市场价', nullable: true })
  marketPrice: number | null;

  @ApiProperty({
    description: 'SKU图片',
    nullable: true,
  })
  image: string | null;

  @ApiProperty({
    description: '规格组合',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  specs: Record<string, string> | null;

  @ApiProperty({ description: '是否默认SKU' })
  isDefault: boolean;
}

export class MallProductCardVo extends ProductWithRelationsVo {
  @ApiProperty({
    description: 'SKU列表',
    type: [MallProductSkuCardVo],
  })
  declare skus?: MallProductSkuCardVo[];

  @ApiProperty({ description: '最低价' })
  minPrice: number;

  @ApiProperty({ description: '最高价' })
  maxPrice: number;

  @ApiProperty({ description: '价格区间展示文本' })
  priceRange: string;
}

export class MallProductListMetaVo {
  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class MallProductListResponseVo {
  @ApiProperty({
    description: '商品列表',
    type: [MallProductCardVo],
  })
  data: MallProductCardVo[];

  @ApiProperty({
    description: '分页信息',
    type: MallProductListMetaVo,
  })
  meta: MallProductListMetaVo;
}

export class MallProductSpecOptionVo {
  @ApiProperty({ description: '规格名称' })
  name: string;

  @ApiProperty({
    description: '规格值列表',
    type: [String],
  })
  values: string[];
}

export class MallProductDetailSkuVo extends MallProductSkuCardVo {
  @ApiProperty({ description: '条形码', nullable: true })
  barcode: string | null;

  @ApiProperty({ description: '重量(kg)', nullable: true })
  weight: number | null;

  @ApiProperty({ description: '体积(m³)', nullable: true })
  volume: number | null;

  @ApiProperty({ description: '排序号' })
  sort: number;

  @ApiProperty({ description: '总库存' })
  totalStock: number;
}

export class MallProductDetailVo extends ProductWithRelationsVo {
  @ApiProperty({
    description: '品牌信息',
    type: BrandVo,
    nullable: true,
  })
  declare brand?: BrandVo | null;

  @ApiProperty({
    description: 'SKU列表',
    type: [MallProductDetailSkuVo],
  })
  declare skus?: MallProductDetailSkuVo[];

  @ApiProperty({
    description: '规格选项',
    type: [MallProductSpecOptionVo],
  })
  specOptions: MallProductSpecOptionVo[];
}

export class MallHotProductVo {
  @ApiProperty({ description: '商品ID' })
  id: number;

  @ApiProperty({ description: '商品名称' })
  name: string;

  @ApiProperty({ description: '商品主图', nullable: true })
  mainImage: string | null;

  @ApiProperty({ description: '最低价' })
  minPrice: number;

  @ApiProperty({ description: '最高价' })
  maxPrice: number;

  @ApiProperty({ description: '价格区间展示文本' })
  priceRange: string;

  @ApiProperty({ description: '热门标签' })
  hotLabel: string;

  @ApiProperty({ description: '标签类型' })
  tagType: string;

  @ApiProperty({ description: '来源 manual/score' })
  source: string;

  @ApiProperty({ description: '热度分数' })
  hotScore: number;

  @ApiProperty({ description: '销量' })
  soldCount: number;

  @ApiProperty({ description: '默认SKU ID', nullable: true })
  defaultSkuId: number | null;
}

export class MallHotProductListResponseVo {
  @ApiProperty({
    description: '热门商品列表',
    type: [MallHotProductVo],
  })
  list: MallHotProductVo[];
}
