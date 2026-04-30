import { Module } from '@nestjs/common';
import { MallHotSearchesController } from './mall-hot-searches.controller';
import { MallHotSearchesService } from './mall-hot-searches.service';

@Module({
  controllers: [MallHotSearchesController],
  providers: [MallHotSearchesService],
  exports: [MallHotSearchesService],
})
export class MallHotSearchesModule {}
