import { ApiProperty } from '@nestjs/swagger';

export class UnitVo {
  @ApiProperty({ description: '单位ID' })
  id: number;

  @ApiProperty({ description: '单位名称' })
  name: string;

  @ApiProperty({ description: '单位编码' })
  code: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromEntity(entity: any): UnitVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      sort: entity.sort,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): UnitVo[] {
    return entities.map(e => UnitVo.fromEntity(e));
  }
}
