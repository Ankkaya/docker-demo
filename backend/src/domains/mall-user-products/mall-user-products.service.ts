import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SkuStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MinioService } from '@/infrastructure/minio/minio.service';

@Injectable()
export class MallUserProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  buildMallProductWhere(extraWhere: Prisma.ProductWhereInput = {}): Prisma.ProductWhereInput {
    return {
      isEnabled: true,
      mallEnabled: true,
      deletedAt: null,
      skus: {
        some: {
          status: SkuStatus.ACTIVE,
          deletedAt: null,
        },
      },
      ...extraWhere,
    };
  }

  buildMallProductInclude() {
    return {
      mallInfo: true,
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
          isDefault: true,
          mallInfo: true,
        },
        orderBy: [{ isDefault: 'desc' }, { sort: 'asc' }],
      },
    };
  }

  async ensureMallProductExists(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: this.buildMallProductWhere({ id: productId }),
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('商品不存在或已下架');
    }

    return product;
  }

  async listMallProductCards(productIds: number[]) {
    if (productIds.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: this.buildMallProductWhere({
        id: { in: productIds },
      }),
      include: this.buildMallProductInclude() as any,
    } as any);

    const cardMap = new Map<number, any>();
    for (const product of products) {
      cardMap.set(product.id, await this.toMallProductCard(product));
    }

    return productIds.map((id) => cardMap.get(id)).filter(Boolean);
  }

  async toMallProductCard(product: any) {
    const prices = product.skus.map((s: any) => Number(s.mallInfo?.salePrice ?? s.salePrice));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
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
      skus: await Promise.all(product.skus.map(async (sku: any) => ({
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
}
