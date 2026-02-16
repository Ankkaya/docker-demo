import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController, SkusController } from './products.controller';

@Module({
  controllers: [ProductsController, SkusController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
