import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ReviewStatus, ShipStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MinioService } from '@/infrastructure/minio/minio.service';
import {
  AuditReviewDto,
  CreateMallReviewDto,
  QueryMallReviewDto,
  QueryReviewDto,
  ReplyReviewDto,
} from './dto';
import { PendingReviewVo, ReviewStatsVo, ReviewVo } from './vo';

function generateReviewNo() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `RV${dateStr}${random}`;
}

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async findAll(query: QueryReviewDto) {
    const { keyword, productId, userId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      ...(productId ? { productId } : {}),
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    };

    if (keyword) {
      where.OR = [
        { reviewNo: { contains: keyword } },
        { order: { orderNo: { contains: keyword } } },
        { product: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: this.reviewInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: await Promise.all(list.map(item => this.toReviewVo(item, false))),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      include: this.reviewInclude(),
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    return this.toReviewVo(review, false);
  }

  async audit(id: number, dto: AuditReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, productId: true },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
      },
      include: this.reviewInclude(),
    });

    await this.refreshProductStats(review.productId);
    return this.toReviewVo(updated, false);
  }

  async reply(id: number, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        replyContent: dto.replyContent.trim(),
        replyAt: new Date(),
      },
      include: this.reviewInclude(),
    });

    return this.toReviewVo(updated, false);
  }

  async remove(id: number) {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, productId: true },
    });

    if (!review) {
      throw new NotFoundException('评价不存在');
    }

    await this.prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.refreshProductStats(review.productId);
    return { success: true };
  }

  async createMallReview(userId: number, dto: CreateMallReviewDto) {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { id: dto.orderItemId },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
          },
        },
        reviews: {
          where: {
            userId,
            deletedAt: null,
          },
          select: { id: true },
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException('订单商品不存在');
    }

    if (orderItem.order.customer.userId !== userId) {
      throw new BadRequestException('只能评价自己的订单商品');
    }

    const reviewable =
      orderItem.order.status === OrderStatus.COMPLETED ||
      orderItem.order.shipStatus === ShipStatus.RECEIVED;

    if (!reviewable) {
      throw new BadRequestException('订单未完成，暂不可评价');
    }

    if (orderItem.reviews.length > 0) {
      throw new ConflictException('该订单商品已评价');
    }

    const images = (dto.images || [])
      .map(item => this.minioService.normalizeStoredFileReference(item))
      .filter((item): item is string => Boolean(item));

    const review = await this.prisma.review.create({
      data: {
        reviewNo: generateReviewNo(),
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        productId: orderItem.sku.product.id,
        skuId: orderItem.skuId,
        userId,
        customerId: orderItem.order.customerId,
        rating: dto.rating,
        content: dto.content?.trim() || null,
        images,
        isAnonymous: dto.isAnonymous ?? false,
        status: ReviewStatus.PENDING,
      },
      include: this.reviewInclude(),
    });

    return this.toReviewVo(review, true);
  }

  async findMallProductReviews(productId: number, query: QueryMallReviewDto) {
    const { rating, hasImage, page = 1, pageSize = 10 } = query;
    const where: Prisma.ReviewWhereInput = {
      productId,
      deletedAt: null,
      status: ReviewStatus.APPROVED,
      ...(rating ? { rating } : {}),
      ...(hasImage ? { images: { isEmpty: false } } : {}),
    };

    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: this.reviewInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      list: await Promise.all(list.map(item => this.toReviewVo(item, true))),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getProductReviewStats(productId: number): Promise<ReviewStatsVo> {
    let stats = await this.prisma.productReviewStat.findUnique({
      where: { productId },
    });

    if (!stats) {
      await this.refreshProductStats(productId);
      stats = await this.prisma.productReviewStat.findUnique({
        where: { productId },
      });
    }

    const totalCount = stats?.totalCount ?? 0;
    const goodCount = stats?.goodCount ?? 0;
    return {
      totalCount,
      goodCount,
      mediumCount: stats?.mediumCount ?? 0,
      badCount: stats?.badCount ?? 0,
      withImageCount: stats?.withImageCount ?? 0,
      avgRating: Number(stats?.avgRating ?? 0),
      positiveRate: totalCount > 0 ? Number(((goodCount / totalCount) * 100).toFixed(2)) : 0,
    };
  }

  async findMyReviews(userId: number, page = 1, pageSize = 10) {
    const where: Prisma.ReviewWhereInput = {
      userId,
      deletedAt: null,
    };

    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: this.reviewInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      list: await Promise.all(list.map(item => this.toReviewVo(item, true))),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findPendingReviews(userId: number): Promise<PendingReviewVo[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          customer: {
            userId,
          },
          deletedAt: null,
          OR: [
            { status: OrderStatus.COMPLETED },
            { shipStatus: ShipStatus.RECEIVED },
          ],
        },
        reviews: {
          none: {
            userId,
            deletedAt: null,
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            receiveDate: true,
            updatedAt: true,
          },
        },
        sku: {
          include: {
            product: {
              select: { id: true, name: true, mainImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(items.map(async item => ({
      orderId: item.order.id,
      orderNo: item.order.orderNo,
      orderItemId: item.id,
      productId: item.sku.product.id,
      productName: item.sku.product.name,
      skuId: item.skuId,
      skuCode: item.sku.skuCode,
      skuSpecs: (item.sku.specs as Record<string, string>) || null,
      quantity: item.quantity,
      price: Number(item.price),
      mainImage: await this.minioService.resolveStoredFileUrl(item.sku.product.mainImage),
      completedAt: item.order.receiveDate || item.order.updatedAt,
    })));
  }

  async refreshProductStats(productId: number) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        deletedAt: null,
        status: ReviewStatus.APPROVED,
      },
      select: {
        rating: true,
        images: true,
      },
    });

    const totalCount = reviews.length;
    const goodCount = reviews.filter(item => item.rating >= 4).length;
    const mediumCount = reviews.filter(item => item.rating === 3).length;
    const badCount = reviews.filter(item => item.rating <= 2).length;
    const withImageCount = reviews.filter(item => item.images.length > 0).length;
    const avgRating = totalCount > 0
      ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / totalCount).toFixed(2))
      : 0;

    await this.prisma.productReviewStat.upsert({
      where: { productId },
      create: {
        productId,
        totalCount,
        goodCount,
        mediumCount,
        badCount,
        withImageCount,
        avgRating,
      },
      update: {
        totalCount,
        goodCount,
        mediumCount,
        badCount,
        withImageCount,
        avgRating,
      },
    });
  }

  private reviewInclude() {
    return {
      order: {
        select: {
          id: true,
          orderNo: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      sku: {
        select: {
          id: true,
          skuCode: true,
          specs: true,
          product: {
            select: {
              id: true,
              name: true,
              mainImage: true,
            },
          },
        },
      },
    } satisfies Prisma.ReviewInclude;
  }

  private async toReviewVo(entity: any, maskUser: boolean): Promise<ReviewVo> {
    const userName = maskUser
      ? (entity.isAnonymous ? '匿名用户' : this.maskName(entity.user?.name || entity.user?.username || '用户'))
      : (entity.user?.name || entity.user?.username || '');

    return {
      id: entity.id,
      reviewNo: entity.reviewNo,
      orderId: entity.orderId,
      orderItemId: entity.orderItemId,
      productId: entity.productId,
      productName: entity.sku.product.name,
      skuId: entity.skuId,
      skuCode: entity.sku.skuCode,
      skuSpecs: (entity.sku.specs as Record<string, string>) || null,
      userId: entity.userId,
      userName,
      rating: entity.rating,
      content: entity.content,
      images: await this.minioService.resolveStoredFileUrls(entity.images || []),
      isAnonymous: entity.isAnonymous,
      status: entity.status,
      replyContent: entity.replyContent,
      replyAt: entity.replyAt,
      reviewedAt: entity.reviewedAt,
      createdAt: entity.createdAt,
    };
  }

  private maskName(name: string) {
    if (name.length <= 1) {
      return `${name}*`;
    }
    if (name.length === 2) {
      return `${name[0]}*`;
    }
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
  }
}
