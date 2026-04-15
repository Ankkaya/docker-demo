import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponReceiveStatus, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { IssueCouponDto } from './dto/issue-coupon.dto';
import { QueryCouponReceiveDto } from './dto/query-coupon-receive.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponReceiveVo, CouponVo } from './vo';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    await this.validateCouponPayload(dto);

    const code = dto.code?.trim() || await this.generateCouponCode();
    await this.ensureCouponCodeUnique(code);

    const created = await this.prisma.coupon.create({
      data: this.buildCreateCouponData(dto, code),
    });
    return CouponVo.fromEntity(created);
  }

  async findAll(query: QueryCouponDto) {
    const where: Prisma.CouponWhereInput = { deletedAt: null };

    if (query.keyword?.trim()) {
      where.OR = [
        { name: { contains: query.keyword.trim(), mode: 'insensitive' } },
        { code: { contains: query.keyword.trim(), mode: 'insensitive' } },
      ];
    }

    if (query.isEnabled !== undefined) {
      where.isEnabled = query.isEnabled;
    }

    const data = await this.prisma.coupon.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    return CouponVo.fromEntities(data);
  }

  async findOne(id: number) {
    const coupon = await this.getCouponOrThrow(id);
    return CouponVo.fromEntity(coupon);
  }

  async update(id: number, dto: UpdateCouponDto) {
    const existing = await this.getCouponOrThrow(id);
    await this.validateCouponPayload(dto, existing);

    if (dto.code && dto.code.trim() !== existing.code) {
      await this.ensureCouponCodeUnique(dto.code.trim(), id);
    }

    if (dto.totalCount !== undefined && dto.totalCount !== null && dto.totalCount < existing.receivedCount) {
      throw new BadRequestException('发放总量不能小于已发放数量');
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: this.buildCouponData(dto, dto.code?.trim()),
    });
    return CouponVo.fromEntity(updated);
  }

  async remove(id: number) {
    await this.getCouponOrThrow(id);
    return this.prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date(), isEnabled: false },
    });
  }

  async issue(id: number, dto: IssueCouponDto) {
    const coupon = await this.getCouponOrThrow(id);
    this.ensureCouponIssuable(coupon);

    const distinctCustomerIds = [...new Set(dto.customerIds)];
    const customers = await this.prisma.customer.findMany({
      where: {
        id: { in: distinctCustomerIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (customers.length !== distinctCustomerIds.length) {
      throw new BadRequestException('存在无效客户，无法发券');
    }

    const issuedCount = await this.prisma.$transaction(async (tx) => {
      const latestCoupon = await tx.coupon.findUnique({ where: { id } });
      if (!latestCoupon || latestCoupon.deletedAt) {
        throw new NotFoundException('优惠券不存在');
      }
      this.ensureCouponIssuable(latestCoupon);

      const issueTargets: Array<{ couponId: number; customerId: number; validFrom: Date; validTo: Date; source: string; remark?: string }> = [];

      for (const customerId of distinctCustomerIds) {
        const currentCount = await tx.couponReceive.count({
          where: {
            couponId: id,
            customerId,
            deletedAt: null,
          },
        });

        if (currentCount >= latestCoupon.perLimit) {
          continue;
        }

        issueTargets.push({
          couponId: id,
          customerId,
          validFrom: latestCoupon.startTime,
          validTo: latestCoupon.endTime,
          source: 'ADMIN',
          remark: dto.remark?.trim() || undefined,
        });
      }

      if (issueTargets.length === 0) {
        throw new BadRequestException('选中的客户都已达到限领次数');
      }

      if (latestCoupon.totalCount !== null && latestCoupon.receivedCount + issueTargets.length > latestCoupon.totalCount) {
        throw new BadRequestException('剩余可发放数量不足');
      }

      await tx.couponReceive.createMany({ data: issueTargets });
      await tx.coupon.update({
        where: { id },
        data: { receivedCount: { increment: issueTargets.length } },
      });

      return issueTargets.length;
    });

    return {
      success: true,
      issuedCount,
      message: `成功发放 ${issuedCount} 张优惠券`,
    };
  }

  async findReceives(query: QueryCouponReceiveDto) {
    const { couponId, customerId, status, keyword, page = 1, pageSize = 10 } = query;
    const where: Prisma.CouponReceiveWhereInput = { deletedAt: null };
    const andConditions: Prisma.CouponReceiveWhereInput[] = [];

    if (couponId) {
      where.couponId = couponId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status === CouponReceiveStatus.EXPIRED) {
      andConditions.push({
        status: CouponReceiveStatus.UNUSED,
        validTo: { lt: new Date() },
      });
    } else if (status) {
      where.status = status;
    }

    if (keyword?.trim()) {
      andConditions.push({
        OR: [
        { coupon: { is: { name: { contains: keyword.trim(), mode: 'insensitive' } } } },
        { coupon: { is: { code: { contains: keyword.trim(), mode: 'insensitive' } } } },
        { customer: { is: { name: { contains: keyword.trim(), mode: 'insensitive' } } } },
        { customer: { is: { code: { contains: keyword.trim(), mode: 'insensitive' } } } },
        { customer: { is: { phone: { contains: keyword.trim(), mode: 'insensitive' } } } },
        ],
      });
    }

    if (andConditions.length) {
      where.AND = andConditions;
    }

    const [data, total] = await Promise.all([
      this.prisma.couponReceive.findMany({
        where,
        include: {
          coupon: { select: { name: true, code: true } },
          customer: { select: { name: true, code: true } },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.couponReceive.count({ where }),
    ]);

    const mapped = CouponReceiveVo.fromEntities(data);

    return {
      data: mapped,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private async getCouponOrThrow(id: number) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, deletedAt: null },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    return coupon;
  }

  private async ensureCouponCodeUnique(code: string, excludeId?: number) {
    const existing = await this.prisma.coupon.findFirst({
      where: {
        code,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('优惠券编码已存在');
    }
  }

  private buildCouponData(dto: Partial<CreateCouponDto>, code?: string) {
    return {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.thresholdAmount !== undefined ? { thresholdAmount: dto.thresholdAmount } : {}),
      ...(dto.discountAmount !== undefined ? { discountAmount: dto.discountAmount } : {}),
      ...(dto.totalCount !== undefined ? { totalCount: dto.totalCount ?? null } : {}),
      ...(dto.perLimit !== undefined ? { perLimit: dto.perLimit } : {}),
      ...(dto.startTime !== undefined ? { startTime: new Date(dto.startTime) } : {}),
      ...(dto.endTime !== undefined ? { endTime: new Date(dto.endTime) } : {}),
      ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
      ...(dto.sort !== undefined ? { sort: dto.sort } : {}),
      ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      ...(dto.type === undefined ? { type: CouponType.CASH } : {}),
    };
  }

  private buildCreateCouponData(dto: CreateCouponDto, code: string): Prisma.CouponCreateInput {
    return {
      name: dto.name.trim(),
      code,
      type: dto.type ?? CouponType.CASH,
      thresholdAmount: dto.thresholdAmount ?? 0,
      discountAmount: dto.discountAmount,
      totalCount: dto.totalCount ?? null,
      perLimit: dto.perLimit ?? 1,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      description: dto.description?.trim() || null,
      sort: dto.sort ?? 0,
      isEnabled: dto.isEnabled ?? true,
    };
  }

  private async validateCouponPayload(dto: Partial<CreateCouponDto>, existing?: any) {
    const startTime = dto.startTime ? new Date(dto.startTime) : existing?.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing?.endTime;
    const thresholdAmount = dto.thresholdAmount ?? (existing ? Number(existing.thresholdAmount) : 0);
    const discountAmount = dto.discountAmount ?? (existing ? Number(existing.discountAmount) : 0);

    if (!startTime || Number.isNaN(startTime.getTime()) || !endTime || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('优惠券生效时间不合法');
    }

    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    if (discountAmount <= 0) {
      throw new BadRequestException('优惠金额必须大于 0');
    }

    if (thresholdAmount < discountAmount) {
      throw new BadRequestException('优惠门槛不能小于优惠金额');
    }
  }

  private ensureCouponIssuable(coupon: any) {
    if (!coupon.isEnabled) {
      throw new BadRequestException('优惠券已停用，不能发放');
    }
    if (coupon.deletedAt) {
      throw new BadRequestException('优惠券已删除');
    }
    if (new Date(coupon.endTime).getTime() < Date.now()) {
      throw new BadRequestException('优惠券已过期，不能发放');
    }
  }

  private async generateCouponCode() {
    let code = '';
    do {
      code = `CP${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    } while (await this.prisma.coupon.findFirst({ where: { code } }));
    return code;
  }
}
