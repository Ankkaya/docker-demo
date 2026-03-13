import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { IconAssetsModule } from '@/icon-assets/icon-assets.module';
import { MallService } from './mall.service';
import { MallController } from './mall.controller';
import { MinioModule } from '@/minio/minio.module';

@Module({
  imports: [PrismaModule, MinioModule, IconAssetsModule],
  controllers: [MallController],
  providers: [MallService],
})
export class MallModule {}
