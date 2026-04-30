import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MallRechargeActivityVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String })
  bonusAmount: string;

  @ApiPropertyOptional({ nullable: true })
  tag: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  startTime: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endTime: Date | null;

  @ApiProperty()
  sort: number;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  firstRechargeOnly: boolean;

  @ApiPropertyOptional({ nullable: true })
  remark: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: any): MallRechargeActivityVo {
    const bonusAmount = Number(entity.bonusAmount || 0);
    return {
      id: entity.id,
      name: entity.name,
      bonusAmount: bonusAmount.toFixed(2),
      tag: entity.tag || null,
      description: entity.description || null,
      startTime: entity.startTime || null,
      endTime: entity.endTime || null,
      sort: entity.sort ?? 0,
      isEnabled: Boolean(entity.isEnabled),
      firstRechargeOnly: Boolean(entity.firstRechargeOnly),
      remark: entity.remark || null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]) {
    return entities.map(entity => this.fromEntity(entity));
  }
}
