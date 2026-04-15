import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MallUserProductsService } from '@/domains/mall-user-products/mall-user-products.service';
import { CreateFavoriteDto, QueryFavoriteDto } from './dto';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mallUserProductsService: MallUserProductsService,
  ) {}

  private get favoriteDelegate(): any {
    return (this.prisma as any).favorite;
  }

  async create(userId: number, dto: CreateFavoriteDto) {
    await this.mallUserProductsService.ensureMallProductExists(dto.productId);

    const favorite = await this.favoriteDelegate.upsert({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
      update: {},
      create: {
        userId,
        productId: dto.productId,
      },
    });

    return {
      id: favorite.id,
      productId: favorite.productId,
      isFavorite: true,
      createdAt: favorite.createdAt,
    };
  }

  async remove(userId: number, productId: number) {
    await this.favoriteDelegate.deleteMany({
      where: { userId, productId },
    });

    return {
      productId,
      isFavorite: false,
    };
  }

  async findAllByUser(userId: number, query: QueryFavoriteDto) {
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
      this.favoriteDelegate.findMany({
        where,
        select: {
          id: true,
          productId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.favoriteDelegate.count({ where }),
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
            favoriteId: item.id,
            favoriteAt: item.createdAt,
            isFavorite: true,
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

  async checkStatus(userId: number, productIds: number[]) {
    const uniqueIds = Array.from(new Set(productIds.filter(id => Number.isInteger(id) && id > 0)));
    if (uniqueIds.length === 0) {
      return [];
    }

    const favorites = await this.favoriteDelegate.findMany({
      where: {
        userId,
        productId: { in: uniqueIds },
      },
      select: { productId: true },
    });

    const favoriteSet = new Set(favorites.map(item => item.productId));
    return uniqueIds.map(productId => ({
      productId,
      isFavorite: favoriteSet.has(productId),
    }));
  }

  async isFavorite(userId: number, productId: number) {
    const favorite = await this.favoriteDelegate.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      select: { id: true },
    });

    return Boolean(favorite);
  }
}
