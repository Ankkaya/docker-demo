import { Module } from '@nestjs/common';
import { MallService } from './mall.service';
import { MallController } from './mall.controller';
import { MinioModule } from '@/minio/minio.module';

@Module({
  imports: [MinioModule],
  controllers: [MallController],
  providers: [MallService],
})
export class MallModule {}
