import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponReceiveStatus, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCouponExchangeCodesDto } from './dto/create-coupon-exchange-codes.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { IssueCouponDto } from './dto/issue-coupon.dto';
import { QueryCouponReceiveDto } from './dto/query-coupon-receive.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponReceiveVo, CouponVo } from './vo';
import {
  COUPON_ISSUE_SCOPE_TYPE,
  COUPON_ISSUE_TYPE,
  COUPON_SCENE_TYPE,
  COUPON_USE_SCOPE_TYPE,
  COUPON_VALID_TYPE,
  CouponIssueScopeTypeValue,
} from './coupon.constants';

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
    if (coupon.issueType !== COUPON_ISSUE_TYPE.ADMIN_ASSIGN) {
      throw new BadRequestException('当前优惠券不是后台发放方式，不能手工发券');
    }
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
      if (latestCoupon.issueType !== COUPON_ISSUE_TYPE.ADMIN_ASSIGN) {
        throw new BadRequestException('当前优惠券不是后台发放方式，不能手工发券');
      }
      this.ensureCouponIssuable(latestCoupon);

      const issueTargets: Array<{
        couponId: number;
        customerId: number;
        validFrom: Date;
        validTo: Date;
        source: string;
        remark?: string;
      }> = [];

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

        const validity = this.resolveReceiveValidity(latestCoupon, new Date());

        issueTargets.push({
          couponId: id,
          customerId,
          validFrom: validity.validFrom,
          validTo: validity.validTo,
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
      throw new ConflictException('优惠券模板编码已存在');
    }
  }

  private buildCouponData(dto: Partial<CreateCouponDto>, code?: string) {
    return {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.sceneType !== undefined ? { sceneType: dto.sceneType } : {}),
      ...(dto.issueType !== undefined ? { issueType: dto.issueType } : {}),
      ...(dto.thresholdAmount !== undefined ? { thresholdAmount: dto.thresholdAmount } : {}),
      ...(dto.discountAmount !== undefined ? { discountAmount: dto.discountAmount } : {}),
      ...(dto.discountRate !== undefined ? { discountRate: dto.discountRate ?? null } : {}),
      ...(dto.maxDiscountAmount !== undefined ? { maxDiscountAmount: dto.maxDiscountAmount ?? null } : {}),
      ...(dto.totalCount !== undefined ? { totalCount: dto.totalCount ?? null } : {}),
      ...(dto.perLimit !== undefined ? { perLimit: dto.perLimit } : {}),
      ...(dto.dailyLimit !== undefined ? { dailyLimit: dto.dailyLimit ?? null } : {}),
      ...(dto.claimStartTime !== undefined ? { claimStartTime: dto.claimStartTime ? new Date(dto.claimStartTime) : null } : {}),
      ...(dto.claimEndTime !== undefined ? { claimEndTime: dto.claimEndTime ? new Date(dto.claimEndTime) : null } : {}),
      ...(dto.startTime !== undefined ? { startTime: new Date(dto.startTime) } : {}),
      ...(dto.endTime !== undefined ? { endTime: new Date(dto.endTime) } : {}),
      ...(dto.validType !== undefined ? { validType: dto.validType } : {}),
      ...(dto.validDays !== undefined ? { validDays: dto.validDays ?? null } : {}),
      ...(dto.validDelayDays !== undefined ? { validDelayDays: dto.validDelayDays } : {}),
      ...(dto.issueScopeType !== undefined ? { issueScopeType: dto.issueScopeType } : {}),
      ...(dto.issueRuleJson !== undefined ? { issueRuleJson: dto.issueRuleJson ?? Prisma.JsonNull } : {}),
      ...(dto.useScopeType !== undefined ? { useScopeType: dto.useScopeType } : {}),
      ...(dto.useRuleJson !== undefined ? { useRuleJson: dto.useRuleJson ?? Prisma.JsonNull } : {}),
      ...(dto.channelScope !== undefined ? { channelScope: dto.channelScope } : {}),
      ...(dto.stackable !== undefined ? { stackable: dto.stackable } : {}),
      ...(dto.canUseWithPromotion !== undefined ? { canUseWithPromotion: dto.canUseWithPromotion } : {}),
      ...(dto.canUseWithMemberPrice !== undefined ? { canUseWithMemberPrice: dto.canUseWithMemberPrice } : {}),
      ...(dto.canUseWithPoint !== undefined ? { canUseWithPoint: dto.canUseWithPoint } : {}),
      ...(dto.canUseWithBalance !== undefined ? { canUseWithBalance: dto.canUseWithBalance } : {}),
      ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      ...(dto.refundReturnMode !== undefined ? { refundReturnMode: dto.refundReturnMode } : {}),
      ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
      ...(dto.sort !== undefined ? { sort: dto.sort } : {}),
      ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      ...(dto.type === undefined ? { type: CouponType.CASH } : {}),
      ...(dto.sceneType === undefined ? { sceneType: COUPON_SCENE_TYPE.COMMON } : {}),
      ...(dto.issueType === undefined ? { issueType: COUPON_ISSUE_TYPE.USER_CLAIM } : {}),
      ...(dto.validType === undefined ? { validType: COUPON_VALID_TYPE.FIXED } : {}),
      ...(dto.issueScopeType === undefined ? { issueScopeType: COUPON_ISSUE_SCOPE_TYPE.ALL } : {}),
      ...(dto.useScopeType === undefined ? { useScopeType: COUPON_USE_SCOPE_TYPE.ALL } : {}),
    };
  }

  async createExchangeCodes(id: number, dto: CreateCouponExchangeCodesDto) {
    const coupon = await this.getCouponOrThrow(id);
    if (coupon.issueType !== COUPON_ISSUE_TYPE.EXCHANGE_CODE) {
      throw new BadRequestException('当前优惠券不是券码兑换方式，不能生成兑换码');
    }
    this.ensureCouponIssuable(coupon);

      const createdCodes = await this.prisma.$transaction(async (tx) => {
      const latestCoupon = await tx.coupon.findUnique({ where: { id } });
      if (!latestCoupon || latestCoupon.deletedAt) {
        throw new NotFoundException('优惠券不存在');
      }
      if (latestCoupon.issueType !== COUPON_ISSUE_TYPE.EXCHANGE_CODE) {
        throw new BadRequestException('当前优惠券不是券码兑换方式，不能生成兑换码');
      }

      const remainCount = latestCoupon.totalCount === null
        ? null
        : Number(latestCoupon.totalCount) - Number(latestCoupon.receivedCount || 0);
      if (remainCount !== null && dto.count > remainCount) {
        throw new BadRequestException(`剩余可发放数量不足，最多还能生成${remainCount}个兑换码`);
      }

      const rows: Array<{
        couponId: number;
        code: string;
        status: string;
        remark: string | null;
        expiresAt: Date;
      }> = [];
      for (let i = 0; i < dto.count; i += 1) {
        rows.push({
          couponId: id,
          code: await this.generateExchangeCode(),
          status: 'UNUSED',
          remark: dto.remark?.trim() || null,
          expiresAt: latestCoupon.claimEndTime || latestCoupon.endTime,
        });
      }

      await (tx as any).couponExchangeCode.createMany({
        data: rows,
      });

      return rows.map(item => item.code);
    });

    return {
      success: true,
      count: createdCodes.length,
      codes: createdCodes,
      message: `成功生成 ${createdCodes.length} 个兑换码`,
    };
  }

  private buildCreateCouponData(dto: CreateCouponDto, code: string): Prisma.CouponCreateInput {
    return {
      name: dto.name.trim(),
      code,
      type: dto.type ?? CouponType.CASH,
      sceneType: dto.sceneType ?? COUPON_SCENE_TYPE.COMMON,
      issueType: dto.issueType ?? COUPON_ISSUE_TYPE.USER_CLAIM,
      thresholdAmount: dto.thresholdAmount ?? 0,
      discountAmount: dto.discountAmount,
      discountRate: dto.discountRate ?? null,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      totalCount: dto.totalCount ?? null,
      perLimit: dto.perLimit ?? 1,
      dailyLimit: dto.dailyLimit ?? null,
      claimStartTime: dto.claimStartTime ? new Date(dto.claimStartTime) : null,
      claimEndTime: dto.claimEndTime ? new Date(dto.claimEndTime) : null,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      validType: dto.validType ?? COUPON_VALID_TYPE.FIXED,
      validDays: dto.validDays ?? null,
      validDelayDays: dto.validDelayDays ?? 0,
      issueScopeType: dto.issueScopeType ?? COUPON_ISSUE_SCOPE_TYPE.ALL,
      issueRuleJson: dto.issueRuleJson ?? undefined,
      useScopeType: dto.useScopeType ?? COUPON_USE_SCOPE_TYPE.ALL,
      useRuleJson: dto.useRuleJson ?? undefined,
      channelScope: dto.channelScope ?? ['MINI_PROGRAM'],
      stackable: dto.stackable ?? false,
      canUseWithPromotion: dto.canUseWithPromotion ?? true,
      canUseWithMemberPrice: dto.canUseWithMemberPrice ?? true,
      canUseWithPoint: dto.canUseWithPoint ?? true,
      canUseWithBalance: dto.canUseWithBalance ?? true,
      isPublic: dto.isPublic ?? true,
      refundReturnMode: dto.refundReturnMode,
      description: dto.description?.trim() || null,
      sort: dto.sort ?? 0,
      isEnabled: dto.isEnabled ?? true,
    } as any;
  }

  private async validateCouponPayload(dto: Partial<CreateCouponDto>, existing?: any) {
    const type = dto.type ?? existing?.type ?? CouponType.CASH;
    const startTime = dto.startTime ? new Date(dto.startTime) : existing?.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing?.endTime;
    const claimStartTime = dto.claimStartTime
      ? new Date(dto.claimStartTime)
      : dto.claimStartTime === null
        ? null
        : existing?.claimStartTime ?? null;
    const claimEndTime = dto.claimEndTime
      ? new Date(dto.claimEndTime)
      : dto.claimEndTime === null
        ? null
        : existing?.claimEndTime ?? null;
    const thresholdAmount = dto.thresholdAmount ?? (existing ? Number(existing.thresholdAmount) : 0);
    const discountAmount = dto.discountAmount ?? (existing ? Number(existing.discountAmount) : 0);
    const discountRate = dto.discountRate ?? existing?.discountRate ?? null;
    const maxDiscountAmount = dto.maxDiscountAmount ?? (existing?.maxDiscountAmount === null || existing?.maxDiscountAmount === undefined ? null : Number(existing.maxDiscountAmount));
    const validType = dto.validType ?? existing?.validType ?? COUPON_VALID_TYPE.FIXED;
    const validDays = dto.validDays ?? existing?.validDays ?? null;
    const validDelayDays = dto.validDelayDays ?? existing?.validDelayDays ?? 0;
    const issueScopeType = dto.issueScopeType ?? existing?.issueScopeType ?? COUPON_ISSUE_SCOPE_TYPE.ALL;
    const issueRuleJson = dto.issueRuleJson ?? existing?.issueRuleJson ?? null;
    const useScopeType = dto.useScopeType ?? existing?.useScopeType ?? COUPON_USE_SCOPE_TYPE.ALL;
    const useRuleJson = dto.useRuleJson ?? existing?.useRuleJson ?? null;
    const channelScope = dto.channelScope ?? existing?.channelScope ?? [];

    if (!startTime || Number.isNaN(startTime.getTime()) || !endTime || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('优惠券生效时间不合法');
    }

    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    if (claimStartTime && Number.isNaN(claimStartTime.getTime())) {
      throw new BadRequestException('领取开始时间不合法');
    }

    if (claimEndTime && Number.isNaN(claimEndTime.getTime())) {
      throw new BadRequestException('领取结束时间不合法');
    }

    if (claimStartTime && claimEndTime && claimStartTime.getTime() >= claimEndTime.getTime()) {
      throw new BadRequestException('领取结束时间必须晚于领取开始时间');
    }

    if (claimStartTime && claimStartTime.getTime() > endTime.getTime()) {
      throw new BadRequestException('领取开始时间不能晚于使用结束时间');
    }

    if (claimEndTime && claimEndTime.getTime() < startTime.getTime() && validType === COUPON_VALID_TYPE.FIXED) {
      throw new BadRequestException('固定有效期优惠券的领取结束时间不能早于使用开始时间');
    }

    if (!Array.isArray(channelScope) || !channelScope.length) {
      throw new BadRequestException('请至少配置一个可领取渠道');
    }

    if (type === 'CASH' || type === 'INSTANT_REDUCTION') {
      if (discountAmount <= 0) {
        throw new BadRequestException(type === 'INSTANT_REDUCTION' ? '立减券金额必须大于 0' : '优惠金额必须大于 0');
      }
    }

    if (type === 'DISCOUNT') {
      if (!discountRate || discountRate < 1 || discountRate > 100) {
        throw new BadRequestException('折扣券折扣率必须在 1 到 100 之间');
      }
      if (maxDiscountAmount !== null && maxDiscountAmount <= 0) {
        throw new BadRequestException('折扣券最高优惠金额必须大于 0');
      }
    }

    if (type === 'CASH' && thresholdAmount < discountAmount) {
      throw new BadRequestException('优惠门槛不能小于优惠金额');
    }

    if (validType === COUPON_VALID_TYPE.RELATIVE) {
      if (!validDays || validDays <= 0) {
        throw new BadRequestException('请配置领券后有效天数');
      }
    }

    if (validDelayDays < 0) {
      throw new BadRequestException('延迟生效天数不能小于 0');
    }

    this.validateIssueRule(issueScopeType, issueRuleJson);
    this.validateUseRule(useScopeType, useRuleJson);
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

  private resolveReceiveValidity(coupon: any, baseTime: Date) {
    const validDelayDays = Number(coupon.validDelayDays || 0);
    const validFrom = coupon.validType === COUPON_VALID_TYPE.RELATIVE
      ? new Date(baseTime.getTime() + validDelayDays * 24 * 60 * 60 * 1000)
      : new Date(coupon.startTime);
    const validTo = coupon.validType === COUPON_VALID_TYPE.RELATIVE
      ? new Date(validFrom.getTime() + Number(coupon.validDays || 0) * 24 * 60 * 60 * 1000)
      : new Date(coupon.endTime);

    return { validFrom, validTo };
  }

  private validateIssueRule(issueScopeType: CouponIssueScopeTypeValue, issueRuleJson: any) {
    if (issueScopeType === COUPON_ISSUE_SCOPE_TYPE.CUSTOMERS) {
      const customerIds = issueRuleJson?.customerIds;
      if (!Array.isArray(customerIds) || !customerIds.length) {
        throw new BadRequestException('指定客户发放范围必须配置 customerIds');
      }
    }
  }

  private validateUseRule(useScopeType: string, useRuleJson: any) {
    const keyMap: Record<string, string | null> = {
      [COUPON_USE_SCOPE_TYPE.ALL]: null,
      [COUPON_USE_SCOPE_TYPE.CATEGORY]: 'categoryIds',
      [COUPON_USE_SCOPE_TYPE.BRAND]: 'brandIds',
      [COUPON_USE_SCOPE_TYPE.PRODUCT]: 'productIds',
      [COUPON_USE_SCOPE_TYPE.SKU]: 'skuIds',
    };

    const key = keyMap[useScopeType];
    if (!key) {
      return;
    }

    const values = useRuleJson?.[key];
    if (!Array.isArray(values) || !values.length) {
      throw new BadRequestException(`使用范围为 ${useScopeType} 时必须配置 ${key}`);
    }
  }

  private async generateCouponCode() {
    let code = '';
    do {
      code = `CP${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    } while (await this.prisma.coupon.findFirst({ where: { code } }));
    return code;
  }

  private async generateExchangeCode() {
    let code = '';
    do {
      code = `EXC${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    } while (await (this.prisma as any).couponExchangeCode.findFirst({ where: { code } }));
    return code;
  }
}
