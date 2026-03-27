import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MallUserProductsModule } from '@/domains/mall-user-products/mall-user-products.module';
import { BrowseHistoriesService } from './browse-histories.service';

@Module({
  imports: [PrismaModule, MallUserProductsModule],
  providers: [BrowseHistoriesService],
  exports: [BrowseHistoriesService],
})
export class BrowseHistoriesModule {}
