import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { IconAssetsModule } from '@/infrastructure/icon-assets/icon-assets.module';
import { MallService } from './mall.service';
import {
  MallAuthController,
  MallCartController,
  MallHomeController,
  MallProductsController,
  MallReviewsController,
} from './mall.controller';
import { MinioModule } from '@/infrastructure/minio/minio.module';
import { CartsModule } from '@/domains/carts/carts.module';
import { AuthModule } from '@/domains/auth/auth.module';
import { ReviewsModule } from '@/domains/reviews/reviews.module';

@Module({
  imports: [PrismaModule, MinioModule, IconAssetsModule, CartsModule, AuthModule, ReviewsModule],
  controllers: [MallProductsController, MallHomeController, MallAuthController, MallCartController, MallReviewsController],
  providers: [MallService],
})
export class MallModule {}
