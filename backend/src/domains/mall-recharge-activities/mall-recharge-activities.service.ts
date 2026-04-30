import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateMallRechargeActivityDto } from './dto/create-mall-recharge-activity.dto';
import { QueryMallRechargeActivityDto } from './dto/query-mall-recharge-activity.dto';
import { UpdateMallRechargeActivityDto } from './dto/update-mall-recharge-activity.dto';
import { MallRechargeActivityVo } from './vo/mall-recharge-activity.vo';

@Injectable()
export class MallRechargeActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private get model() {
    return (this.prisma as any).mallRechargeActivity;
  }

  async create(dto: CreateMallRechargeActivityDto) {
    this.validatePayload(dto);
    const created = await this.model.create({
      data: this.buildPayload(dto),
    });
    return MallRechargeActivityVo.fromEntity(created);
  }

  async findAll(query: QueryMallRechargeActivityDto) {
    const { keyword, isEnabled, page = 1, pageSize = 10 } = query;
    const where: any = {
      deletedAt: null,
    };

    if (keyword?.trim()) {
      where.OR = [
        { name: { contains: keyword.trim(), mode: 'insensitive' } },
        { tag: { contains: keyword.trim(), mode: 'insensitive' } },
      ];
    }

    if (typeof isEnabled === 'boolean') {
      where.isEnabled = isEnabled;
    }

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    return {
      data: MallRechargeActivityVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const entity = await this.getEntityOrThrow(id);
    return MallRechargeActivityVo.fromEntity(entity);
  }

  async update(id: number, dto: UpdateMallRechargeActivityDto) {
    await this.getEntityOrThrow(id);
    this.validatePayload(dto);
    const updated = await this.model.update({
      where: { id },
      data: this.buildPayload(dto),
    });
    return MallRechargeActivityVo.fromEntity(updated);
  }

  async remove(id: number) {
    await this.getEntityOrThrow(id);
    await this.model.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isEnabled: false,
      },
    });
    return { success: true };
  }

  async findAvailableForCustomer(customerId: number) {
    const now = new Date();
    const completedRechargeCount = await (this.prisma as any).balanceRechargeOrder.count({
      where: {
        customerId,
        deletedAt: null,
        status: 'COMPLETED',
      },
    });

    const list = await this.model.findMany({
      where: {
        deletedAt: null,
        isEnabled: true,
        OR: [
          { startTime: null, endTime: null },
          { startTime: null, endTime: { gte: now } },
          { startTime: { lte: now }, endTime: null },
          { startTime: { lte: now }, endTime: { gte: now } },
        ],
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return MallRechargeActivityVo.fromEntities(
      list.filter((item: any) => !(item.firstRechargeOnly && completedRechargeCount > 0)),
    );
  }

  async resolveAvailableActivityForCustomer(customerId: number, activityId?: number | null) {
    if (!activityId) {
      return null;
    }

    const activities = await this.findAvailableForCustomer(customerId);
    const matched = activities.find(item => item.id === activityId);
    if (!matched) {
      throw new BadRequestException('当前充值活动不可用，请刷新后重试');
    }
    return matched;
  }

  private async getEntityOrThrow(id: number) {
    const entity = await this.model.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      throw new NotFoundException('充值活动不存在');
    }

    return entity;
  }

  private validatePayload(dto: Partial<CreateMallRechargeActivityDto>) {
    if (dto.startTime && dto.endTime && new Date(dto.endTime).getTime() <= new Date(dto.startTime).getTime()) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
  }

  private buildPayload(dto: Partial<CreateMallRechargeActivityDto>) {
    const payload: Record<string, any> = {};

    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }
    if (dto.bonusAmount !== undefined) {
      payload.bonusAmount = Number(dto.bonusAmount);
    }
    if (dto.tag !== undefined) {
      payload.tag = dto.tag?.trim() || null;
    }
    if (dto.description !== undefined) {
      payload.description = dto.description?.trim() || null;
    }
    if (dto.startTime !== undefined) {
      payload.startTime = dto.startTime ? new Date(dto.startTime) : null;
    }
    if (dto.endTime !== undefined) {
      payload.endTime = dto.endTime ? new Date(dto.endTime) : null;
    }
    if (dto.sort !== undefined) {
      payload.sort = dto.sort ?? 0;
    }
    if (dto.isEnabled !== undefined) {
      payload.isEnabled = dto.isEnabled;
    }
    if (dto.firstRechargeOnly !== undefined) {
      payload.firstRechargeOnly = dto.firstRechargeOnly;
    }
    if (dto.remark !== undefined) {
      payload.remark = dto.remark?.trim() || null;
    }

    return payload;
  }
}
