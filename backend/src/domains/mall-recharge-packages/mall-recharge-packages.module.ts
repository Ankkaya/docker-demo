import { Module } from '@nestjs/common';
import { MallRechargePackagesController } from './mall-recharge-packages.controller';
import { MallRechargePackagesService } from './mall-recharge-packages.service';

@Module({
  controllers: [MallRechargePackagesController],
  providers: [MallRechargePackagesService],
  exports: [MallRechargePackagesService],
})
export class MallRechargePackagesModule {}
