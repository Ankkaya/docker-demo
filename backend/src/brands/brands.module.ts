import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { MinioModule } from '@/minio/minio.module';

@Module({
  imports: [MinioModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
