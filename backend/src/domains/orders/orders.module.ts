import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { CustomerAddressesModule } from '@/domains/customer-addresses/customer-addresses.module';

@Module({
  imports: [PrismaModule, CustomerAddressesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
