import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { UnitsModule } from './units/units.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { InventoriesModule } from './inventories/inventories.module';
import { MallModule } from './mall/mall.module';
import { MinioModule } from './minio/minio.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PurchaseReceiptsModule } from './purchase-receipts/purchase-receipts.module';
import { PurchaseReturnsModule } from './purchase-returns/purchase-returns.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { SaleReturnsModule } from './sale-returns/sale-returns.module';
import { TransfersModule } from './transfers/transfers.module';
import { AdjustmentsModule } from './adjustments/adjustments.module';
import { CartsModule } from './carts/carts.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    RolesModule,
    MenusModule,
    UnitsModule,
    CategoriesModule,
    BrandsModule,
    WarehousesModule,
    SuppliersModule,
    CustomersModule,
    ProductsModule,
    InventoriesModule,
    MallModule,
    MinioModule,
    PurchasesModule,
    PurchaseReceiptsModule,
    PurchaseReturnsModule,
    PaymentsModule,
    OrdersModule,
    ShipmentsModule,
    SaleReturnsModule,
    TransfersModule,
    AdjustmentsModule,
    CartsModule,
  ],
})
export class AppModule {}
