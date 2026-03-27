import { ApiProperty } from '@nestjs/swagger';
import { MallProductCardVo, MallProductListMetaVo } from '@/applications/mall/vo/mall.vo';

export class FavoriteItemVo extends MallProductCardVo {
  @ApiProperty({ description: '收藏ID' })
  favoriteId: number;

  @ApiProperty({ description: '收藏时间' })
  favoriteAt: Date;
}

export class FavoriteListVo {
  @ApiProperty({ type: [FavoriteItemVo] })
  data: FavoriteItemVo[];

  @ApiProperty({ type: MallProductListMetaVo })
  meta: MallProductListMetaVo;
}

export class FavoriteStatusVo {
  @ApiProperty({ description: '商品ID' })
  productId: number;

  @ApiProperty({ description: '是否已收藏' })
  isFavorite: boolean;
}
