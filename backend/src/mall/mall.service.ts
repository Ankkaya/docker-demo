import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { QueryMallProductDto } from './dto/query-mall-product.dto';
import { SkuStatus, Prisma } from '@prisma/client';

@Injectable()
export class MallService {
  constructor(private prisma: PrismaService) {}

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
    const where: Prisma.ProductWhereInput = {
      isEnabled: true,
      deletedAt: null, // 过滤已删除的商品
      skus: {
        some: {
          status: SkuStatus.ACTIVE,
          deletedAt: null, // 过滤已删除的SKU
        },
      },
    };

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
        include: {
          category: {
            select: { id: true, name: true },
          },
          brand: {
            select: { id: true, name: true },
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
            },
            orderBy: { isDefault: 'desc' },
          },
          unit: {
            select: { id: true, name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    // 处理返回数据，计算价格区间
    const processedData = data.map((product) => {
      const prices = product.skus.map((s) => Number(s.salePrice));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return {
        ...product,
        priceRange: minPrice === maxPrice
          ? `¥${minPrice.toFixed(2)}`
          : `¥${minPrice.toFixed(2)} - ¥${maxPrice.toFixed(2)}`,
        minPrice,
        maxPrice,
      };
    });

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
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        isEnabled: true,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        brand: {
          select: { id: true, name: true, logo: true },
        },
        unit: {
          select: { id: true, name: true },
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
            barcode: true,
            weight: true,
            volume: true,
            isDefault: true,
            sort: true,
            inventories: {
              select: {
                warehouseId: true,
                available: true,
              },
            },
          },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在或已下架');
    }

    // 计算总库存
    const skusWithStock = product.skus.map((sku) => {
      const totalStock = sku.inventories.reduce((sum, inv) => sum + inv.available, 0);
      return {
        ...sku,
        totalStock,
        inventories: undefined, // 移除详细库存信息
      };
    });

    // 提取规格选项
    const specOptions = this.extractSpecOptions(product.skus);

    return {
      ...product,
      skus: skusWithStock,
      specOptions,
    };
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
    return this.prisma.category.findMany({
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
  }

  // 获取启用的品牌列表
  async findBrands() {
    return this.prisma.brand.findMany({
      where: { isEnabled: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        logo: true,
        description: true,
      },
      orderBy: { sort: 'asc' },
    });
  }
}
