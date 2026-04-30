import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MallRechargeActivityVo } from '@/domains/mall-recharge-activities/vo/mall-recharge-activity.vo';

export class MallRechargePackageVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String })
  rechargeAmount: string;

  @ApiPropertyOptional({ nullable: true })
  tag: string | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  sort: number;

  @ApiProperty()
  isEnabled: boolean;

  @ApiPropertyOptional({ nullable: true })
  remark: string | null;

  @ApiProperty({ type: [MallRechargeActivityVo] })
  activities: MallRechargeActivityVo[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: any): MallRechargePackageVo {
    return {
      id: entity.id,
      name: entity.name,
      rechargeAmount: Number(entity.rechargeAmount || 0).toFixed(2),
      tag: entity.tag || null,
      description: entity.description || null,
      sort: entity.sort ?? 0,
      isEnabled: Boolean(entity.isEnabled),
      remark: entity.remark || null,
      activities: (entity.activities || [])
        .filter((item: any) => item.isEnabled !== false)
        .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0) || (a.activity?.sort ?? 0) - (b.activity?.sort ?? 0))
        .map((item: any) => MallRechargeActivityVo.fromEntity(item.activity || item)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]) {
    return entities.map(entity => this.fromEntity(entity));
  }
}
