import { ApiProperty } from '@nestjs/swagger';
import { MallProductCardVo, MallProductListMetaVo } from '@/applications/mall/vo/mall.vo';

export class BrowseHistoryItemVo extends MallProductCardVo {
  @ApiProperty({ description: '浏览记录ID' })
  historyId: number;

  @ApiProperty({ description: '浏览次数' })
  viewCount: number;

  @ApiProperty({ description: '首次浏览时间' })
  firstViewedAt: Date;

  @ApiProperty({ description: '最近浏览时间' })
  lastViewedAt: Date;
}

export class BrowseHistoryListVo {
  @ApiProperty({ type: [BrowseHistoryItemVo] })
  data: BrowseHistoryItemVo[];

  @ApiProperty({ type: MallProductListMetaVo })
  meta: MallProductListMetaVo;
}
