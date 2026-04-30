import { forwardRef, Module } from '@nestjs/common';
import { MallModule } from '@/applications/mall/mall.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [forwardRef(() => MallModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
