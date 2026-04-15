import { ApiProperty } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';

export class CouponVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: CouponType })
  type: CouponType;

  @ApiProperty()
  typeText: string;

  @ApiProperty()
  thresholdAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty({ nullable: true })
  totalCount: number | null;

  @ApiProperty()
  perLimit: number;

  @ApiProperty()
  receivedCount: number;

  @ApiProperty()
  usedCount: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  sort: number;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  statusText: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: any): CouponVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      typeText: entity.type === 'CASH' ? '满减券' : entity.type,
      thresholdAmount: Number(entity.thresholdAmount || 0),
      discountAmount: Number(entity.discountAmount || 0),
      totalCount: entity.totalCount ?? null,
      perLimit: entity.perLimit,
      receivedCount: entity.receivedCount,
      usedCount: entity.usedCount,
      startTime: entity.startTime,
      endTime: entity.endTime,
      description: entity.description ?? null,
      sort: entity.sort,
      isEnabled: entity.isEnabled,
      statusText: CouponVo.resolveStatusText(entity),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): CouponVo[] {
    return entities.map(entity => CouponVo.fromEntity(entity));
  }

  private static resolveStatusText(entity: any) {
    if (!entity.isEnabled) {
      return '已停用';
    }
    const now = Date.now();
    if (new Date(entity.startTime).getTime() > now) {
      return '未开始';
    }
    if (new Date(entity.endTime).getTime() < now) {
      return '已过期';
    }
    return '进行中';
  }
}
