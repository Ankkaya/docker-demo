import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MinioModule } from '@/infrastructure/minio/minio.module';
import { IconAssetsModule } from '@/infrastructure/icon-assets/icon-assets.module';

@Module({
  imports: [MinioModule, IconAssetsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
