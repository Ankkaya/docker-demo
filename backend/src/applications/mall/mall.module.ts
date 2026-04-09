import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { IconAssetsModule } from '@/infrastructure/icon-assets/icon-assets.module';
import { MallService } from './mall.service';
import {
  MallAuthController,
  MallCartController,
  MallHomeController,
  MallOrdersController,
  MallPaymentsController,
  MallProductsController,
  MallReviewsController,
} from './mall.controller';
import { MinioModule } from '@/infrastructure/minio/minio.module';
import { CartsModule } from '@/domains/carts/carts.module';
import { CustomerAddressesModule } from '@/domains/customer-addresses/customer-addresses.module';
import { AuthModule } from '@/domains/auth/auth.module';
import { ReviewsModule } from '@/domains/reviews/reviews.module';
import { MallAddressesController } from './mall.controller';
import { MallOrdersService } from './mall-orders.service';
import { MallBalanceService } from './mall-balance.service';
import { MallBalanceController } from './mall.controller';
import { FavoritesModule } from '@/domains/favorites/favorites.module';
import { BrowseHistoriesModule } from '@/domains/browse-histories/browse-histories.module';
import { SystemSettingsModule } from '@/domains/system-settings/system-settings.module';
import { MallBrowseHistoriesController, MallFavoritesController } from './mall.controller';
import { WechatPayService } from './wechat-pay.service';

@Module({
  imports: [PrismaModule, MinioModule, IconAssetsModule, CartsModule, CustomerAddressesModule, AuthModule, ReviewsModule, FavoritesModule, BrowseHistoriesModule, SystemSettingsModule],
  controllers: [MallProductsController, MallHomeController, MallAuthController, MallCartController, MallAddressesController, MallOrdersController, MallPaymentsController, MallReviewsController, MallBalanceController, MallFavoritesController, MallBrowseHistoriesController],
  providers: [MallService, MallOrdersService, MallBalanceService, WechatPayService],
})
export class MallModule {}
