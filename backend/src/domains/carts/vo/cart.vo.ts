import { ApiProperty } from '@nestjs/swagger';

export class CartItemVo {
  @ApiProperty({ description: '购物车ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  userId: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: 'SKU ID' })
  skuId: number;

  @ApiProperty({ description: 'SKU编码' })
  skuCode: string;

  @ApiProperty({ description: '规格组合' })
  specs: Record<string, string>;

  @ApiProperty({ description: '商品ID' })
  productId: number;

  @ApiProperty({ description: '商品名称' })
  productName: string;

  @ApiProperty({ description: '商品主图', required: false, nullable: true })
  mainImage: string | null;

  @ApiProperty({ description: 'SKU图片', required: false, nullable: true })
  skuImage: string | null;

  @ApiProperty({ description: '单价' })
  salePrice: number;

  @ApiProperty({ description: '数量' })
  quantity: number;

  @ApiProperty({ description: '是否选中' })
  selected: boolean;

  @ApiProperty({ description: '小计金额' })
  subtotal: number;

  @ApiProperty({ description: '库存数量' })
  stock: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class CartStatsVo {
  @ApiProperty({ description: '购物车商品总数' })
  totalCount: number;

  @ApiProperty({ description: '选中商品数量' })
  selectedCount: number;

  @ApiProperty({ description: '选中商品总金额' })
  selectedAmount: number;
}

export class CartListVo {
  @ApiProperty({ description: '购物车列表', type: [CartItemVo] })
  list: CartItemVo[];

  @ApiProperty({ description: '统计信息' })
  stats: CartStatsVo;
}
