import { ApiProperty } from '@nestjs/swagger';

export class BannerVo {
  @ApiProperty({ description: '轮播图 ID' })
  id: number;

  @ApiProperty({ description: '轮播图名称' })
  name: string;

  @ApiProperty({ description: '图片地址' })
  image: string;

  @ApiProperty({ description: '是否启用跳转' })
  jumpEnabled: boolean;

  @ApiProperty({ description: '跳转路径', nullable: true })
  jumpPath: string | null;

  @ApiProperty({ description: '排序号' })
  sort: number;

  @ApiProperty({ description: '备注', nullable: true })
  remark: string | null;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): BannerVo {
    return {
      id: entity.id,
      name: entity.name,
      image: entity.image,
      jumpEnabled: entity.jumpEnabled,
      jumpPath: entity.jumpPath,
      sort: entity.sort,
      remark: entity.remark,
      isEnabled: entity.isEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): BannerVo[] {
    return entities.map(entity => BannerVo.fromEntity(entity));
  }
}
