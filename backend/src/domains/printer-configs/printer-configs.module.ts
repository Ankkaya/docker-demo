import { Module } from '@nestjs/common';
import { PrinterConfigsController } from './printer-configs.controller';
import { PrinterConfigsService } from './printer-configs.service';

@Module({
  controllers: [PrinterConfigsController],
  providers: [PrinterConfigsService],
})
export class PrinterConfigsModule {}
