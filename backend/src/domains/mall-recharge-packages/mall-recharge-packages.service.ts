import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateMallRechargePackageDto } from './dto/create-mall-recharge-package.dto';
import { QueryMallRechargePackageDto } from './dto/query-mall-recharge-package.dto';
import { UpdateMallRechargePackageDto } from './dto/update-mall-recharge-package.dto';
import { MallRechargePackageVo } from './vo/mall-recharge-package.vo';

@Injectable()
export class MallRechargePackagesService {
  constructor(private readonly prisma: PrismaService) {}

  private get packageModel() {
    return (this.prisma as any).mallRechargePackage;
  }

  private get packageActivityModel() {
    return (this.prisma as any).mallRechargePackageActivity;
  }

  async create(dto: CreateMallRechargePackageDto) {
    const activityIds = await this.normalizeActivityIds(dto.activityIds);
    const created = await this.packageModel.create({
      data: this.buildPayload(dto),
    });
    await this.replaceActivities(created.id, activityIds);
    return this.findOne(created.id);
  }

  async findAll(query: QueryMallRechargePackageDto) {
    const { keyword, isEnabled, page = 1, pageSize = 10 } = query;
    const where: any = { deletedAt: null };

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
      this.packageModel.findMany({
        where,
        include: {
          activities: {
            include: { activity: true },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.packageModel.count({ where }),
    ]);

    return {
      data: MallRechargePackageVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const entity = await this.packageModel.findFirst({
      where: { id, deletedAt: null },
      include: {
        activities: {
          include: { activity: true },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException('充值套餐不存在');
    }

    return MallRechargePackageVo.fromEntity(entity);
  }

  async update(id: number, dto: UpdateMallRechargePackageDto) {
    await this.findOne(id);
    const activityIds = dto.activityIds === undefined ? undefined : await this.normalizeActivityIds(dto.activityIds);
    await this.packageModel.update({
      where: { id },
      data: this.buildPayload(dto),
    });
    if (activityIds) {
      await this.replaceActivities(id, activityIds);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.packageModel.update({
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

    const list = await this.packageModel.findMany({
      where: {
        deletedAt: null,
        isEnabled: true,
      },
      include: {
        activities: {
          where: { isEnabled: true },
          include: {
            activity: true,
          },
          orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return MallRechargePackageVo.fromEntities(
      list.map((item: any) => ({
        ...item,
        activities: (item.activities || []).filter((relation: any) => {
          const activity = relation.activity;
          if (!activity || activity.deletedAt || !activity.isEnabled) {
            return false;
          }
          if (activity.firstRechargeOnly && completedRechargeCount > 0) {
            return false;
          }
          if (activity.startTime && new Date(activity.startTime).getTime() > now.getTime()) {
            return false;
          }
          if (activity.endTime && new Date(activity.endTime).getTime() < now.getTime()) {
            return false;
          }
          return true;
        }),
      })),
    );
  }

  async resolvePackageForCustomer(customerId: number, packageId?: number | null) {
    if (!packageId) {
      return null;
    }

    const packages = await this.findAvailableForCustomer(customerId);
    const matched = packages.find(item => item.id === packageId);
    if (!matched) {
      throw new BadRequestException('当前充值套餐不可用，请刷新后重试');
    }
    return matched;
  }

  private buildPayload(dto: Partial<CreateMallRechargePackageDto>) {
    const payload: Record<string, any> = {};

    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }
    if (dto.rechargeAmount !== undefined) {
      payload.rechargeAmount = Number(dto.rechargeAmount);
    }
    if (dto.tag !== undefined) {
      payload.tag = dto.tag?.trim() || null;
    }
    if (dto.description !== undefined) {
      payload.description = dto.description?.trim() || null;
    }
    if (dto.sort !== undefined) {
      payload.sort = dto.sort ?? 0;
    }
    if (dto.isEnabled !== undefined) {
      payload.isEnabled = dto.isEnabled;
    }
    if (dto.remark !== undefined) {
      payload.remark = dto.remark?.trim() || null;
    }

    return payload;
  }

  private async normalizeActivityIds(activityIds?: number[]) {
    const normalized = Array.from(new Set((activityIds || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)));
    if (!normalized.length) {
      return [];
    }

    const count = await (this.prisma as any).mallRechargeActivity.count({
      where: {
        id: { in: normalized },
        deletedAt: null,
      },
    });

    if (count !== normalized.length) {
      throw new BadRequestException('存在无效的充值活动');
    }

    return normalized;
  }

  private async replaceActivities(packageId: number, activityIds: number[]) {
    await this.packageActivityModel.deleteMany({
      where: { packageId },
    });

    if (!activityIds.length) {
      return;
    }

    await this.packageActivityModel.createMany({
      data: activityIds.map((activityId, index) => ({
        packageId,
        activityId,
        sort: index,
        isEnabled: true,
      })),
    });
  }
}
