import { ApiProperty } from '@nestjs/swagger';

export class BrandVo {
  @ApiProperty({ description: '品牌ID' })
  id: number;

  @ApiProperty({ description: '品牌名称' })
  name: string;

  @ApiProperty({ description: '品牌logo', nullable: true })
  logo: string | null;

  @ApiProperty({ description: '品牌描述', nullable: true })
  description: string | null;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): BrandVo {
    return {
      id: entity.id,
      name: entity.name,
      logo: entity.logo,
      description: entity.description,
      sort: entity.sort,
      isEnabled: entity.isEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): BrandVo[] {
    return entities.map(e => BrandVo.fromEntity(e));
  }
}
