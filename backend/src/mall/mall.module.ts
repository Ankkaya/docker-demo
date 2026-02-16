import { Module } from '@nestjs/common';
import { MallService } from './mall.service';
import { MallController } from './mall.controller';

@Module({
  controllers: [MallController],
  providers: [MallService],
})
export class MallModule {}
