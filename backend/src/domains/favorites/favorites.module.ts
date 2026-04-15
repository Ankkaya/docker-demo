import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MallUserProductsModule } from '@/domains/mall-user-products/mall-user-products.module';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [PrismaModule, MallUserProductsModule],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
