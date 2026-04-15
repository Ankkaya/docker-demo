import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MinioModule } from '@/infrastructure/minio/minio.module';
import { MallUserProductsService } from './mall-user-products.service';

@Module({
  imports: [PrismaModule, MinioModule],
  providers: [MallUserProductsService],
  exports: [MallUserProductsService],
})
export class MallUserProductsModule {}
