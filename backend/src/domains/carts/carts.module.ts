import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AdminCartsController, MallCartsController } from './carts.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MinioModule } from '@/infrastructure/minio/minio.module';

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [AdminCartsController, MallCartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
