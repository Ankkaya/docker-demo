import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';

export class ReviewVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  reviewNo: string;

  @ApiProperty()
  orderId: number;

  @ApiProperty()
  orderItemId: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  skuId: number;

  @ApiProperty()
  skuCode: string;

  @ApiProperty({ type: Object, nullable: true })
  skuSpecs: Record<string, string> | null;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ nullable: true })
  content: string | null;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  isAnonymous: boolean;

  @ApiProperty({ enum: ReviewStatus })
  status: ReviewStatus;

  @ApiProperty({ nullable: true })
  replyContent: string | null;

  @ApiProperty({ nullable: true })
  replyAt: Date | null;

  @ApiProperty({ nullable: true })
  reviewedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class ReviewStatsVo {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  goodCount: number;

  @ApiProperty()
  mediumCount: number;

  @ApiProperty()
  badCount: number;

  @ApiProperty()
  withImageCount: number;

  @ApiProperty()
  avgRating: number;

  @ApiProperty()
  positiveRate: number;
}

export class PendingReviewVo {
  @ApiProperty()
  orderId: number;

  @ApiProperty()
  orderNo: string;

  @ApiProperty()
  orderItemId: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  skuId: number;

  @ApiProperty()
  skuCode: string;

  @ApiProperty({ type: Object, nullable: true })
  skuSpecs: Record<string, string> | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ nullable: true })
  mainImage: string | null;

  @ApiProperty()
  completedAt: Date;
}
