import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { MinioModule } from '@/minio/minio.module';

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
