import { ApiProperty } from '@nestjs/swagger';
import { CouponReceiveStatus } from '@prisma/client';

export class CouponReceiveVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  couponId: number;

  @ApiProperty()
  couponName: string;

  @ApiProperty()
  couponCode: string;

  @ApiProperty()
  customerId: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ nullable: true })
  customerCode: string | null;

  @ApiProperty({ enum: CouponReceiveStatus })
  status: CouponReceiveStatus;

  @ApiProperty()
  statusText: string;

  @ApiProperty({ nullable: true })
  source: string | null;

  @ApiProperty()
  validFrom: Date;

  @ApiProperty()
  validTo: Date;

  @ApiProperty()
  receivedAt: Date;

  @ApiProperty({ nullable: true })
  usedAt: Date | null;

  @ApiProperty({ nullable: true })
  remark: string | null;

  static fromEntity(entity: any): CouponReceiveVo {
    const status = CouponReceiveVo.resolveStatus(entity);
    return {
      id: entity.id,
      couponId: entity.couponId,
      couponName: entity.coupon?.name || '',
      couponCode: entity.coupon?.code || '',
      customerId: entity.customerId,
      customerName: entity.customer?.name || '',
      customerCode: entity.customer?.code || null,
      status,
      statusText: CouponReceiveVo.resolveStatusText(status),
      source: entity.source ?? null,
      validFrom: entity.validFrom,
      validTo: entity.validTo,
      receivedAt: entity.receivedAt,
      usedAt: entity.usedAt ?? null,
      remark: entity.remark ?? null,
    };
  }

  static fromEntities(entities: any[]): CouponReceiveVo[] {
    return entities.map(entity => CouponReceiveVo.fromEntity(entity));
  }

  private static resolveStatus(entity: any): CouponReceiveStatus {
    if (entity.status === 'UNUSED' && new Date(entity.validTo).getTime() < Date.now()) {
      return 'EXPIRED';
    }
    return entity.status;
  }

  private static resolveStatusText(status: CouponReceiveStatus) {
    const map: Record<CouponReceiveStatus, string> = {
      UNUSED: '未使用',
      USED: '已使用',
      EXPIRED: '已过期',
      INVALID: '已作废',
    };
    return map[status];
  }
}
