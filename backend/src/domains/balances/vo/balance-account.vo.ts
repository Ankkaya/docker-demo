import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceAccountStatus } from '@prisma/client';

class BalanceCustomerUserVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;
}

class BalanceCustomerVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: BalanceCustomerUserVo, nullable: true })
  user: BalanceCustomerUserVo | null;
}

export class BalanceAccountVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  customerId: number;

  @ApiProperty({ type: BalanceCustomerVo })
  customer: BalanceCustomerVo;

  @ApiProperty({ type: String })
  availableBalance: string;

  @ApiProperty({ type: String })
  frozenBalance: string;

  @ApiProperty({ type: String })
  totalRecharged: string;

  @ApiProperty({ type: String })
  totalPresented: string;

  @ApiProperty({ type: String })
  totalConsumed: string;

  @ApiProperty({ type: String })
  totalRefunded: string;

  @ApiProperty({ type: String })
  totalAdjusted: string;

  @ApiProperty({ enum: BalanceAccountStatus })
  status: BalanceAccountStatus;

  @ApiPropertyOptional({ nullable: true })
  remark: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: any): BalanceAccountVo {
    const totalConsumed = Number(entity.totalConsumed || 0);
    const totalRefunded = Number(entity.totalRefunded || 0);

    return {
      id: entity.id,
      customerId: entity.customerId,
      customer: {
        id: entity.customer.id,
        name: entity.customer.name,
        code: entity.customer.code,
        phone: entity.customer.phone || null,
        user: entity.customer.user
          ? {
              id: entity.customer.user.id,
              username: entity.customer.user.username,
              email: entity.customer.user.email || null,
            }
          : null,
      },
      availableBalance: entity.availableBalance.toString(),
      frozenBalance: entity.frozenBalance.toString(),
      totalRecharged: entity.totalRecharged.toString(),
      totalPresented: (entity.totalPresented ?? 0).toString(),
      totalConsumed: Math.max(0, totalConsumed - totalRefunded).toFixed(2),
      totalRefunded: totalRefunded.toFixed(2),
      totalAdjusted: entity.totalAdjusted.toString(),
      status: entity.status,
      remark: entity.remark || null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: any[]): BalanceAccountVo[] {
    return entities.map(entity => this.fromEntity(entity));
  }
}
