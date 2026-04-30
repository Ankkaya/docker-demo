import { ApiProperty } from '@nestjs/swagger';

export class MallHotSearchVo {
  @ApiProperty({ description: '热门搜索词 ID' })
  id: number;

  @ApiProperty({ description: '热门搜索词' })
  keyword: string;

  @ApiProperty({ description: '排序号' })
  sort: number;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '搜索次数' })
  searchCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): MallHotSearchVo {
    return {
      id: entity.id,
      keyword: entity.keyword,
      sort: entity.sort,
      isEnabled: entity.isEnabled,
      searchCount: entity.searchCount ?? 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): MallHotSearchVo[] {
    return entities.map(entity => MallHotSearchVo.fromEntity(entity));
  }
}
