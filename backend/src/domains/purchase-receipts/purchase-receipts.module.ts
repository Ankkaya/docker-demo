import { Module } from '@nestjs/common';
import { PurchaseReceiptsService } from './purchase-receipts.service';
import { PurchaseReceiptsController } from './purchase-receipts.controller';

@Module({
  controllers: [PurchaseReceiptsController],
  providers: [PurchaseReceiptsService],
  exports: [PurchaseReceiptsService],
})
export class PurchaseReceiptsModule {}
