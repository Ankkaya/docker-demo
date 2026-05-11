import { Module } from '@nestjs/common';
import { SaleReturnsService } from './sale-returns.service';
import { SaleReturnsController } from './sale-returns.controller';
import { PaymentsModule } from '@/domains/payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [SaleReturnsController],
  providers: [SaleReturnsService],
})
export class SaleReturnsModule {}
