import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { MallRechargeActivitiesController } from './mall-recharge-activities.controller';
import { MallRechargeActivitiesService } from './mall-recharge-activities.service';

@Module({
  imports: [PrismaModule],
  controllers: [MallRechargeActivitiesController],
  providers: [MallRechargeActivitiesService],
  exports: [MallRechargeActivitiesService],
})
export class MallRechargeActivitiesModule {}
