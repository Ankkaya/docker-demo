import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { IconAssetsModule } from '@/infrastructure/icon-assets/icon-assets.module';
import { MallService } from './mall.service';
import { MallHomeController, MallProductsController } from './mall.controller';
import { MinioModule } from '@/infrastructure/minio/minio.module';

@Module({
  imports: [PrismaModule, MinioModule, IconAssetsModule],
  controllers: [MallProductsController, MallHomeController],
  providers: [MallService],
})
export class MallModule {}
