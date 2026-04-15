import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MallUserProductsService } from '@/domains/mall-user-products/mall-user-products.service';
import { CreateBrowseHistoryDto, QueryBrowseHistoryDto } from './dto';

@Injectable()
export class BrowseHistoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mallUserProductsService: MallUserProductsService,
  ) {}

  private get browseHistoryDelegate(): any {
    return (this.prisma as any).browseHistory;
  }

  async record(userId: number, dto: CreateBrowseHistoryDto) {
    await this.mallUserProductsService.ensureMallProductExists(dto.productId);

    const now = new Date();
    const history = await this.browseHistoryDelegate.upsert({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
      update: {
        viewCount: { increment: 1 },
        lastViewedAt: now,
      },
      create: {
        userId,
        productId: dto.productId,
        firstViewedAt: now,
        lastViewedAt: now,
      },
    });

    return {
      id: history.id,
      productId: history.productId,
      viewCount: history.viewCount,
      firstViewedAt: history.firstViewedAt,
      lastViewedAt: history.lastViewedAt,
    };
  }

  async findAllByUser(userId: number, query: QueryBrowseHistoryDto) {
    const { keyword, page = 1, pageSize = 10 } = query;

    const where: any = {
      userId,
      product: this.mallUserProductsService.buildMallProductWhere(),
    };

    if (keyword) {
      where.product = {
        ...where.product,
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      };
    }

    const [items, total] = await Promise.all([
      this.browseHistoryDelegate.findMany({
        where,
        select: {
          id: true,
          productId: true,
          viewCount: true,
          firstViewedAt: true,
          lastViewedAt: true,
        },
        orderBy: { lastViewedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.browseHistoryDelegate.count({ where }),
    ]);

    const products = await this.mallUserProductsService.listMallProductCards(items.map(item => item.productId));
    const productMap = new Map<number, any>(products.map(item => [item.id, item]));

    return {
      data: items
        .map((item) => {
          const product = productMap.get(item.productId);
          if (!product) {
            return null;
          }

          return {
            ...product,
            historyId: item.id,
            viewCount: item.viewCount,
            firstViewedAt: item.firstViewedAt,
            lastViewedAt: item.lastViewedAt,
          };
        })
        .filter(Boolean),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async remove(userId: number, productId: number) {
    await this.browseHistoryDelegate.deleteMany({
      where: { userId, productId },
    });

    return {
      productId,
      success: true,
    };
  }

  async clear(userId: number) {
    await this.browseHistoryDelegate.deleteMany({
      where: { userId },
    });

    return { success: true };
  }
}
