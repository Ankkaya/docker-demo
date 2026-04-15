import { ApiProperty } from '@nestjs/swagger';

export class CategoryVo {
  @ApiProperty({ description: '分类ID' })
  id: number;

  @ApiProperty({ description: '分类名称' })
  name: string;

  @ApiProperty({ description: '分类编码' })
  code: string;

  @ApiProperty({ description: '子标题', nullable: true })
  subtitle: string | null;

  @ApiProperty({ description: '备注', nullable: true })
  remark: string | null;

  @ApiProperty({ description: '父级ID', nullable: true })
  parentId: number | null;

  @ApiProperty({ description: '层级' })
  level: number;

  @ApiProperty({ description: '排序号' })
  sort: number;

  @ApiProperty({ description: '是否作为商城搜索推荐分类' })
  mallRecommend: boolean;

  @ApiProperty({ description: '商城搜索推荐排序号' })
  mallRecommendSort: number;

  @ApiProperty({ description: '分类图标', nullable: true })
  icon: string | null;

  @ApiProperty({ description: '分类图标 URL', nullable: true })
  iconUrl?: string | null;

  @ApiProperty({ description: '分类图片', nullable: true })
  image: string | null;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): CategoryVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      subtitle: entity.subtitle,
      remark: entity.remark,
      parentId: entity.parentId,
      level: entity.level,
      sort: entity.sort,
      mallRecommend: entity.mallRecommend ?? false,
      mallRecommendSort: entity.mallRecommendSort ?? 0,
      icon: entity.icon,
      iconUrl: entity.iconUrl ?? null,
      image: entity.image,
      isEnabled: entity.isEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): CategoryVo[] {
    return entities.map(e => CategoryVo.fromEntity(e));
  }
}

export class CategoryWithParentVo extends CategoryVo {
  @ApiProperty({ description: '父级分类', type: CategoryVo, nullable: true })
  parent?: CategoryVo | null;

  static fromEntity(entity: any): CategoryWithParentVo {
    return {
      ...super.fromEntity(entity),
      parent: entity.parent ? CategoryVo.fromEntity(entity.parent) : null,
    };
  }

  static fromEntities(entities: any[]): CategoryWithParentVo[] {
    return entities.map(e => CategoryWithParentVo.fromEntity(e));
  }
}

export class CategoryTreeVo extends CategoryVo {
  @ApiProperty({ description: '子分类', type: [CategoryTreeVo], nullable: true })
  children?: CategoryTreeVo[];

  static fromEntity(entity: any): CategoryTreeVo {
    const vo: CategoryTreeVo = {
      ...super.fromEntity(entity),
    };

    if (entity.children && entity.children.length > 0) {
      vo.children = CategoryTreeVo.fromEntities(entity.children);
    }

    return vo;
  }

  static fromEntities(entities: any[]): CategoryTreeVo[] {
    return entities.map(e => CategoryTreeVo.fromEntity(e));
  }
}
