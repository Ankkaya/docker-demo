import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController, SkusController } from './products.controller';
import { MinioModule } from '@/minio/minio.module';

@Module({
  imports: [MinioModule],
  controllers: [ProductsController, SkusController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
