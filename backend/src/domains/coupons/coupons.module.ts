import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { CouponsController } from './coupons.controller';
import { CouponAutoGrantService } from './coupon-auto-grant.service';
import { CouponsService } from './coupons.service';

@Module({
  imports: [PrismaModule],
  controllers: [CouponsController],
  providers: [CouponsService, CouponAutoGrantService],
  exports: [CouponAutoGrantService],
})
export class CouponsModule {}
