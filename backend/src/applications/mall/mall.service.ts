import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { QueryMallProductDto } from './dto/query-mall-product.dto';
import { QueryHotProductDto } from './dto/query-hot-product.dto';
import { SkuStatus, Prisma } from '@prisma/client';
import { MinioService } from '@/infrastructure/minio/minio.service';
import { IconAssetsService } from '@/infrastructure/icon-assets/icon-assets.service';

@Injectable()
export class MallService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    private iconAssetsService: IconAssetsService,
  ) {}

  private buildMallProductInclude() {
    return {
      mallInfo: true,
      mallStat: true,
      category: {
        select: { id: true, name: true },
      },
      brand: {
        select: { id: true, name: true, logo: true },
      },
      skus: {
        where: { status: SkuStatus.ACTIVE, deletedAt: null },
        select: {
          id: true,
          skuCode: true,
          salePrice: true,
          marketPrice: true,
          image: true,
          specs: true,
          isDefault: true,
          mallInfo: true,
          inventories: {
            select: {
              available: true,
            },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { sort: 'asc' }],
      },
      unit: {
        select: { id: true, name: true },
      },
    };
  }

  private buildMallProductWhere(
    extraWhere: Prisma.ProductWhereInput = {},
    requireAvailableStock = false,
  ): Prisma.ProductWhereInput {
    const skuWhere: Prisma.ProductSkuWhereInput = {
      status: SkuStatus.ACTIVE,
      deletedAt: null,
    };

    if (requireAvailableStock) {
      skuWhere.inventories = {
        some: {
          available: { gt: 0 },
        },
      };
    }

    return {
      isEnabled: true,
      mallEnabled: true,
      deletedAt: null,
      skus: {
        some: skuWhere,
      },
      ...extraWhere,
    };
  }

  // 获取商城商品列表（仅展示已上架的商品）
  async findProducts(query: QueryMallProductDto) {
    const {
      keyword,
      categoryId,
      brandId,
      sort = 'new',
      page = 1,
      pageSize = 10,
    } = query;

    // 构建where条件
    const where: any = this.buildMallProductWhere();

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    // 构建排序
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    // 简化排序逻辑，暂时只支持创建时间排序
    // 价格排序需要更复杂的聚合查询
    switch (sort) {
      case 'price_asc':
      case 'price_desc':
      case 'sales':
      case 'new':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.buildMallProductInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      } as any),
      this.prisma.product.count({ where }),
    ]) as [any[], number];

    // 处理返回数据，计算价格区间
    const processedData = await Promise.all(data.map(async (product) => this.toMallProductCard(product)));

    return {
      data: processedData,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 获取商品详情（商城展示）
  async findProductDetail(id: number) {
    const product: any = await this.prisma.product.findFirst({
      where: this.buildMallProductWhere({
        id,
      }) as any,
      include: {
        ...this.buildMallProductInclude(),
        skus: {
          where: { status: SkuStatus.ACTIVE, deletedAt: null },
          select: {
            id: true,
            skuCode: true,
            salePrice: true,
            marketPrice: true,
            image: true,
            specs: true,
            barcode: true,
            weight: true,
            volume: true,
            isDefault: true,
            sort: true,
            mallInfo: true,
            inventories: {
              select: {
                warehouseId: true,
                available: true,
              },
            },
          },
          orderBy: { sort: 'asc' },
        },
      } as any,
    } as any);

    if (!product) {
      throw new NotFoundException('商品不存在或已下架');
    }

    // 计算总库存
    const skusWithStock = await Promise.all(product.skus.map(async (sku) => {
      const totalStock = sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
      return {
        ...sku,
        salePrice: sku.mallInfo?.salePrice ?? sku.salePrice,
        marketPrice: sku.mallInfo?.marketPrice ?? sku.marketPrice,
        image: await this.minioService.resolveStoredFileUrl(sku.mallInfo?.image || sku.image),
        totalStock,
        inventories: undefined, // 移除详细库存信息
      };
    }));

    // 提取规格选项
    const specOptions = this.extractSpecOptions(product.skus);

    return {
      ...product,
      name: product.mallInfo?.name || product.name,
      description: product.mallInfo?.description || product.description,
      detail: product.mallInfo?.detail || product.detail,
      mainImage: await this.minioService.resolveStoredFileUrl(product.mallInfo?.mainImage || product.mainImage),
      images: await this.minioService.resolveStoredFileUrls(
        Array.isArray(product.mallInfo?.images) ? product.mallInfo.images : product.images,
      ),
      brand: product.brand
        ? {
            ...product.brand,
            logo: await this.minioService.resolveStoredFileUrl(product.brand.logo),
          }
        : null,
      skus: skusWithStock,
      specOptions,
    };
  }

  async findHotProducts(query: QueryHotProductDto) {
    const limit = query.limit ?? 8;
    const include = this.buildMallProductInclude();

    const manualProducts: any[] = await this.prisma.product.findMany({
      where: this.buildMallProductWhere({
        mallInfo: {
          is: {
            isHot: true,
          },
        },
      }, true),
      include: include as any,
      orderBy: [
        { mallInfo: { hotSort: 'asc' } },
        { updatedAt: 'desc' },
      ],
      take: limit,
    } as any);

    const manualIds = new Set(manualProducts.map((item) => item.id));
    const remain = Math.max(limit - manualProducts.length, 0);

    let scoreProducts: any[] = [];
    if (remain > 0) {
      scoreProducts = await this.prisma.product.findMany({
        where: this.buildMallProductWhere({
          id: { notIn: Array.from(manualIds) },
          mallStat: {
            isNot: null,
          },
        }, true),
        include: include as any,
        orderBy: [
          { mallStat: { hotScore: 'desc' } },
          { updatedAt: 'desc' },
        ],
        take: remain,
      } as any);
    }

    const list = await Promise.all(
      [...manualProducts, ...scoreProducts].slice(0, limit).map(async (product, index) => {
        const source = manualIds.has(product.id) ? 'manual' : 'score';
        return this.toHotProductVo(product, source, source === 'score' ? index + 1 : undefined);
      }),
    );

    return { list };
  }

  // 提取规格选项（用于前端选择）
  private extractSpecOptions(skus: any[]) {
    const specMap = new Map<string, Set<string>>();

    skus.forEach((sku) => {
      const specs = sku.specs as Record<string, string>;
      if (specs) {
        Object.entries(specs).forEach(([key, value]) => {
          if (!specMap.has(key)) {
            specMap.set(key, new Set());
          }
          specMap.get(key)!.add(value);
        });
      }
    });

    return Array.from(specMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }

  // 获取启用的分类列表
  async findCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isEnabled: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
        level: true,
        icon: true,
        image: true,
      },
      orderBy: { sort: 'asc' },
    });

    return Promise.all(categories.map(async (category) => ({
      ...category,
      iconUrl: await this.iconAssetsService.resolveIconUrl(category.icon),
      image: await this.minioService.resolveStoredFileUrl(category.image),
    })));
  }

  // 获取启用的品牌列表
  async findBrands() {
    const brands = await this.prisma.brand.findMany({
      where: { isEnabled: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        logo: true,
        description: true,
      },
      orderBy: { sort: 'asc' },
    });

    return Promise.all(brands.map(async (brand) => ({
      ...brand,
      logo: await this.minioService.resolveStoredFileUrl(brand.logo),
    })));
  }

  // 获取启用的轮播图列表
  async findBanners() {
    const banners = await this.prisma.banner.findMany({
      where: {
        isEnabled: true,
        deletedAt: null,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return Promise.all(banners.map(async (banner) => ({
      ...banner,
      image: await this.minioService.resolveStoredFileUrl(banner.image),
    })));
  }

  private async toMallProductCard(product: any) {
    const prices = product.skus.map((s) => Number(s.mallInfo?.salePrice ?? s.salePrice));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const mallImages = Array.isArray(product.mallInfo?.images) ? product.mallInfo.images : product.images;

    return {
      ...product,
      name: product.mallInfo?.name || product.name,
      description: product.mallInfo?.description || product.description,
      detail: product.mallInfo?.detail || product.detail,
      mainImage: await this.minioService.resolveStoredFileUrl(product.mallInfo?.mainImage || product.mainImage),
      images: await this.minioService.resolveStoredFileUrls(mallImages),
      brand: product.brand
        ? {
            ...product.brand,
            logo: await this.minioService.resolveStoredFileUrl(product.brand.logo),
          }
        : null,
      skus: await Promise.all(product.skus.map(async (sku) => ({
        ...sku,
        salePrice: sku.mallInfo?.salePrice ?? sku.salePrice,
        marketPrice: sku.mallInfo?.marketPrice ?? sku.marketPrice,
        image: await this.minioService.resolveStoredFileUrl(sku.mallInfo?.image || sku.image),
      }))),
      priceRange: minPrice === maxPrice
        ? `¥${minPrice.toFixed(2)}`
        : `¥${minPrice.toFixed(2)} - ¥${maxPrice.toFixed(2)}`,
      minPrice,
      maxPrice,
    };
  }

  private resolveHotTag(product: any, source: 'manual' | 'score', rank?: number) {
    if (source === 'manual' && product.mallInfo?.hotLabel) {
      return {
        tag: product.mallInfo.hotLabel,
        tagType: 'MANUAL',
      };
    }

    const stat = product.mallStat;
    if (rank && rank <= 10) {
      return {
        tag: '爆款',
        tagType: 'BEST_SELLER',
      };
    }

    if (stat?.saleQty7d >= 50) {
      return {
        tag: '近7天热销',
        tagType: 'HOT_SALES_7D',
      };
    }

    if (stat?.saleQty30d >= 200) {
      return {
        tag: '30天爆款',
        tagType: 'HOT_SALES_30D',
      };
    }

    return {
      tag: '人气推荐',
      tagType: 'POPULAR',
    };
  }

  private async toHotProductVo(product: any, source: 'manual' | 'score', rank?: number) {
    const card = await this.toMallProductCard(product);
    const totalSold = Number(product.mallStat?.saleQty30d ?? 0);
    const tagInfo = this.resolveHotTag(product, source, rank);

    return {
      id: card.id,
      name: card.name,
      mainImage: card.mainImage,
      minPrice: card.minPrice,
      maxPrice: card.maxPrice,
      priceRange: card.priceRange,
      hotLabel: tagInfo.tag,
      tagType: tagInfo.tagType,
      source,
      hotScore: Number(product.mallStat?.hotScore ?? 0),
      soldCount: totalSold,
      defaultSkuId: card.skus.find((sku: any) => sku.isDefault)?.id ?? card.skus[0]?.id ?? null,
    };
  }
}
